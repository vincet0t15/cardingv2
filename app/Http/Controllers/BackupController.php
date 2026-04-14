<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

class BackupController extends Controller
{
    private function getMySqlPath(): string
    {
        $executableFinder = new ExecutableFinder;

        $mysqlPath = $executableFinder->find('mysql');
        if ($mysqlPath) {
            return dirname($mysqlPath);
        }

        $mysqldumpPath = $executableFinder->find('mysqldump');
        if ($mysqldumpPath) {
            return dirname($mysqldumpPath);
        }

        if (PHP_OS === 'WINNT') {
            $possiblePaths = [
                'C:\laragon\bin\mysql\current\bin',
                'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin',
                'C:\laragon\bin\mysql\mysql-8.4.2-winx64\bin',
                'C:\laragon\bin\mysql\mysql-8.4.1-winx64\bin',
                'C:\laragon\bin\mysql\mysql-8.4.0-winx64\bin',
                'C:\laragon\bin\mysql\mysql-8.3-winx64\bin',
                'C:\laragon\bin\mysql\mysql-8.0-winx64\bin',
                'C:\xampp\mysql\bin',
            ];

            foreach ($possiblePaths as $path) {
                $mysqldump = $path.'\mysqldump.exe';
                if (File::exists($mysqldump)) {
                    return $path;
                }
            }
        }

        return '';
    }

    private function getDbConfig(): array
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        return [
            'host' => $config['host'] ?? '127.0.0.1',
            'port' => $config['port'] ?? '3306',
            'database' => $config['database'] ?? '',
            'username' => $config['username'] ?? 'root',
            'password' => $config['password'] ?? '',
        ];
    }

    public function index(Request $request)
    {
        $backups = $this->getBackups($request);
        $dbConfig = $this->getDbConfig();

        return Inertia::render('settings/Backup', [
            'backups' => $backups['data'],
            'pagination' => [
                'current_page' => $backups['current_page'],
                'last_page' => $backups['last_page'],
                'per_page' => $backups['per_page'],
                'total' => $backups['total'],
            ],
            'databaseName' => $dbConfig['database'],
        ]);
    }

    public function create()
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $fileName = "backup_{$timestamp}.sql";
            $backupPath = storage_path("app/backups/{$fileName}");

            File::ensureDirectoryExists(storage_path('app/backups'));

            $dbConfig = $this->getDbConfig();
            $connection = config('database.default');

            if ($connection === 'sqlite') {
                $dbPath = config('database.connections.sqlite.database');
                if (! File::exists($dbPath)) {
                    throw new \Exception('SQLite database file not found');
                }
                $sqlitePath = database_path('database.sqlite');
                copy($sqlitePath, $backupPath);
                $fileSize = File::size($backupPath);

                return back()->with('success', 'Backup created successfully! ('.$this->formatFileSize($fileSize).')');
            }

            if (! in_array($connection, ['mysql', 'mariadb'])) {
                throw new \Exception("Unsupported database connection: {$connection}");
            }

            $isDocker = env('APP_ENV') === 'docker' || getenv('DOCKER_CONTAINER');
            $dockerContainer = env('DOCKER_MYSQL_CONTAINER', 'carding_app_mysql');

            if ($isDocker) {
                $process = Process::fromShellCommandLine(sprintf(
                    'docker exec %s mysqldump -u%s -p%s %s',
                    $dockerContainer,
                    escapeshellarg($dbConfig['username']),
                    escapeshellarg($dbConfig['password']),
                    escapeshellarg($dbConfig['database'])
                ));
                $process->setTimeout(300);
                $output = $process->mustRun();
                File::put($backupPath, $output->getOutput());
            } else {
                $executableFinder = new ExecutableFinder;
                $mysqldump = $executableFinder->find('mysqldump');

                if (! $mysqldump) {
                    $mysqlPath = $this->getMySqlPath();
                    if ($mysqlPath) {
                        $mysqldump = $mysqlPath.DIRECTORY_SEPARATOR.'mysqldump'.(PHP_OS === 'WINNT' ? '.exe' : '');
                    }
                }

                if (! $mysqldump) {
                    throw new \Exception('mysqldump not found. Please ensure MySQL is installed and in PATH, or configure DOCKER_MYSQL_CONTAINER in .env for Docker mode.');
                }

                $pass = $dbConfig['password'] ? '-p'.$dbConfig['password'] : '';
                $command = sprintf(
                    'cmd /c "%s -h%s -P%s -u%s %s --single-transaction --quick --lock-tables=false %s -r %s"',
                    $mysqldump,
                    $dbConfig['host'],
                    $dbConfig['port'],
                    $dbConfig['username'],
                    $pass,
                    $dbConfig['database'],
                    $backupPath
                );
                exec($command, $output, $returnCode);
                if ($returnCode !== 0) {
                    throw new \Exception('mysqldump failed with code: '.$returnCode);
                }
            }

            if (! File::exists($backupPath)) {
                throw new \Exception('Backup file was not created');
            }

            $fileSize = File::size($backupPath);
            if ($fileSize === 0) {
                File::delete($backupPath);
                throw new \Exception('Backup file is empty - check database credentials');
            }

            return back()->with('success', 'Backup created successfully! ('.$this->formatFileSize($fileSize).')');
        } catch (ProcessFailedException $e) {
            Log::error('Backup process failed: '.$e->getMessage());

            return back()->with('error', 'Backup failed: '.$e->getProcess()->getErrorOutput());
        } catch (\Exception $e) {
            Log::error('Backup failed: '.$e->getMessage());

            return back()->with('error', $e->getMessage());
        }
    }

    public function restore(Request $request)
    {
        $request->validate([
            'file_name' => 'required|string',
        ]);

        try {
            $fileName = $request->input('file_name');
            $backupPath = storage_path("app/backups/{$fileName}");

            if (! File::exists($backupPath)) {
                return back()->with('error', 'Backup file not found');
            }

            $this->restoreDb($backupPath);

            $this->clearCachesAndDisconnect();

            return back()->with('success', 'Database restored successfully!');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return back()->with('error', $e->getMessage());
        }
    }

    public function uploadRestore(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|max:204800',
        ]);

        try {
            $file = $request->file('backup_file');
            $fileName = time().'_'.$file->getClientOriginalName();

            $path = storage_path("app/temp/{$fileName}");
            File::ensureDirectoryExists(storage_path('app/temp'));

            $file->move(storage_path('app/temp'), $fileName);

            $this->restoreDb($path);

            File::delete($path);

            $this->clearCachesAndDisconnect();

            return back()->with('success', 'Database restored successfully!');
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return back()->with('error', $e->getMessage());
        }
    }

    private function restoreDb(string $filePath): void
    {
        $connection = config('database.default');

        if ($connection === 'sqlite') {
            $sqlitePath = database_path('database.sqlite');
            copy($filePath, $sqlitePath);

            return;
        }

        if (! in_array($connection, ['mysql', 'mariadb'])) {
            throw new \Exception("Unsupported database connection: {$connection}");
        }

        $dbConfig = $this->getDbConfig();
        $isDocker = env('APP_ENV') === 'docker' || getenv('DOCKER_CONTAINER');
        $dockerContainer = env('DOCKER_MYSQL_CONTAINER', 'carding_app_mysql');

        if ($isDocker) {
            $process = Process::fromShellCommandLine(sprintf(
                'cat %s | docker exec -i %s mysql -u%s -p%s %s',
                escapeshellarg($filePath),
                $dockerContainer,
                escapeshellarg($dbConfig['username']),
                escapeshellarg($dbConfig['password']),
                escapeshellarg($dbConfig['database'])
            ));
            $process->setTimeout(600);
            $process->mustRun();
        } else {
            $executableFinder = new ExecutableFinder;
            $mysql = $executableFinder->find('mysql');

            if (! $mysql) {
                $mysqlPath = $this->getMySqlPath();
                if ($mysqlPath) {
                    $mysql = $mysqlPath.DIRECTORY_SEPARATOR.'mysql'.(PHP_OS === 'WINNT' ? '.exe' : '');
                }
            }

            if (! $mysql) {
                throw new \Exception('mysql not found. Please ensure MySQL is installed and in PATH, or configure DOCKER_MYSQL_CONTAINER in .env for Docker mode.');
            }

            $pass = $dbConfig['password'] ? '-p'.$dbConfig['password'] : '';
            $command = sprintf(
                'cmd /c "%s -h%s -P%s -u%s %s %s < %s"',
                $mysql,
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['username'],
                $pass,
                $dbConfig['database'],
                $filePath
            );
            exec($command, $output, $returnCode);
            if ($returnCode !== 0) {
                throw new \Exception('mysql restore failed with code: '.$returnCode);
            }
        }
    }

    public function download($fileName)
    {
        $path = storage_path("app/backups/{$fileName}");

        if (! File::exists($path)) {
            return back()->with('error', 'File not found');
        }

        return response()->download($path);
    }

    public function destroy($fileName)
    {
        $path = storage_path("app/backups/{$fileName}");

        if (File::exists($path)) {
            File::delete($path);
        }

        return back()->with('success', 'Deleted successfully');
    }

    private function clearCachesAndDisconnect(): void
    {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('view:clear');
        Artisan::call('route:clear');

        DB::disconnect();
    }

    private function getBackups(Request $request): array
    {
        $dir = storage_path('app/backups');

        if (! File::exists($dir)) {
            return ['data' => [], 'current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0];
        }

        $files = File::files($dir);

        $data = collect($files)->map(function ($file) {
            return [
                'name' => $file->getFilename(),
                'size' => $this->formatFileSize($file->getSize()),
                'date' => date('Y-m-d H:i:s', $file->getMTime()),
            ];
        })->sortByDesc('date')->values()->toArray();

        return [
            'data' => $data,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => count($data),
            'total' => count($data),
        ];
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2).' '.$units[$i];
    }
}
