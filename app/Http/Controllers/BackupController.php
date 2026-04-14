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
        } else {
            $linuxPaths = [
                '/usr/bin',
                '/usr/local/bin',
                '/www/server/mysql/bin',
                '/opt/mysql/bin',
            ];

            foreach ($linuxPaths as $path) {
                $mysqldump = $path.'/mysqldump';
                if (File::exists($mysqldump)) {
                    return $path;
                }
            }
        }

        return '';
    }

    private function isDocker(): bool
    {
        return env('APP_ENV') === 'docker' || getenv('DOCKER_CONTAINER') || file_exists('/.dockerenv') || env('DOCKER_MYSQL_CONTAINER');
    }

    private function getDockerContainer(): string
    {
        return env('DOCKER_MYSQL_CONTAINER', 'mysql');
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

            if ($this->isDocker()) {
                if (file_exists('/usr/bin/mysqldump') || file_exists('/usr/local/bin/mysqldump')) {
                    $mysqldump = file_exists('/usr/bin/mysqldump') ? '/usr/bin/mysqldump' : '/usr/local/bin/mysqldump';
                    $pass = $dbConfig['password'] ? '-p'.$dbConfig['password'] : '';
                    $command = sprintf(
                        '%s -h%s -P%s -u%s %s --single-transaction --quick --lock-tables=false %s',
                        $mysqldump,
                        $dbConfig['host'],
                        $dbConfig['port'],
                        $dbConfig['username'],
                        $pass,
                        $dbConfig['database']
                    );
                    Log::info('Docker mysqldump command: '.$command);
                    $returnCode = 0;
                    $output = [];
                    exec($command, $output, $returnCode);
                    if ($returnCode !== 0) {
                        Log::error('Docker mysqldump failed. Code: '.$returnCode.' Output: '.implode("\n", $output));
                        throw new \Exception('Docker mysqldump failed with code: '.$returnCode);
                    }
                    File::put($backupPath, implode("\n", $output));
                } else {
                    throw new \Exception('mysqldump not found in Docker container');
                }
            } else {
                $mysqldump = $this->getMySqlPath().DIRECTORY_SEPARATOR.'mysqldump'.(PHP_OS === 'WINNT' ? '.exe' : '');

                if (! File::exists($mysqldump)) {
                    throw new \Exception('mysqldump not found at: '.$mysqldump);
                }

                $pass = $dbConfig['password'] ? '-p'.$dbConfig['password'] : '';
                $command = sprintf(
                    '"%s" -h%s -P%s -u%s %s --single-transaction --quick --lock-tables=false %s -r "%s"',
                    $mysqldump,
                    $dbConfig['host'],
                    $dbConfig['port'],
                    $dbConfig['username'],
                    $pass,
                    $dbConfig['database'],
                    $backupPath
                );
                $returnCode = 0;
                system($command, $returnCode);
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

            return to_route('settings.backup.index')->with('success', 'Backup created successfully! ('.$this->formatFileSize($fileSize).')');
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

        if ($this->isDocker()) {
            if (file_exists('/usr/bin/mysql') || file_exists('/usr/local/bin/mysql')) {
                $mysql = file_exists('/usr/bin/mysql') ? '/usr/bin/mysql' : '/usr/local/bin/mysql';
                $pass = $dbConfig['password'] ? '-p'.$dbConfig['password'] : '';
                $command = sprintf(
                    '%s -h%s -P%s -u%s %s %s < "%s"',
                    $mysql,
                    $dbConfig['host'],
                    $dbConfig['port'],
                    $dbConfig['username'],
                    $pass,
                    $dbConfig['database'],
                    $filePath
                );
                Log::info('Docker mysql restore command: '.$command);
                $returnCode = 0;
                exec($command, $output, $returnCode);
                if ($returnCode !== 0) {
                    Log::error('Docker mysql restore failed. Code: '.$returnCode);
                    throw new \Exception('Docker mysql restore failed with code: '.$returnCode);
                }
            } else {
                throw new \Exception('mysql not found in Docker container');
            }
        } else {
            $mysql = $this->getMySqlPath().DIRECTORY_SEPARATOR.'mysql'.(PHP_OS === 'WINNT' ? '.exe' : '');

            if (! File::exists($mysql)) {
                throw new \Exception('mysql not found at: '.$mysql);
            }

            $pass = $dbConfig['password'] ? '-p'.$dbConfig['password'] : '';
            $command = sprintf(
                '"%s" -h%s -P%s -u%s %s %s < "%s"',
                $mysql,
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['username'],
                $pass,
                $dbConfig['database'],
                $filePath
            );
            $returnCode = 0;
            system($command, $returnCode);
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
