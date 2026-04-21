<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
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

            if ($this->canUseShellExecution()) {
                if (PHP_OS === 'WINNT') {
                    $mysqlPath = $this->getMySqlPath();
                    if ($mysqlPath === '') {
                        throw new \Exception('mysqldump not found in common Windows locations');
                    }

                    $mysqldump = $mysqlPath.DIRECTORY_SEPARATOR.'mysqldump.exe';
                } else {
                    $mysqldump = '/usr/bin/mysqldump';
                }

                if (! File::exists($mysqldump)) {
                    throw new \Exception('mysqldump not found at: '.$mysqldump);
                }

                Log::info('Backup create: preparing mysqldump', [
                    'binary' => $mysqldump,
                    'database' => $dbConfig['database'],
                    'backup_path' => $backupPath,
                    'host' => $dbConfig['host'],
                    'port' => $dbConfig['port'],
                    'user' => $dbConfig['username'],
                ]);

                $command = [
                    $mysqldump,
                    '-h'.$dbConfig['host'],
                    '-P'.$dbConfig['port'],
                    '-u'.$dbConfig['username'],
                ];

                if (! empty($dbConfig['password'])) {
                    $command[] = '-p'.$dbConfig['password'];
                }

                $command = array_merge($command, [
                    '--single-transaction',
                    '--quick',
                    '--lock-tables=false',
                    $dbConfig['database'],
                    '-r',
                    $backupPath,
                ]);

                $escapedCommand = implode(' ', array_map('escapeshellarg', $command));
                \exec($escapedCommand, $output, $returnCode);

                if ($returnCode !== 0) {
                    throw new \Exception('mysqldump failed with code: '.$returnCode.' Output: '.implode("\n", $output));
                }
            } else {
                $this->dumpDatabaseManually($backupPath);
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
        if ($this->canUseShellExecution()) {
            if (PHP_OS === 'WINNT') {
                $mysqlPath = $this->getMySqlPath();
                if ($mysqlPath === '') {
                    throw new \Exception('mysql not found in common Windows locations');
                }

                $mysql = $mysqlPath.DIRECTORY_SEPARATOR.'mysql.exe';
            } else {
                $mysql = '/usr/bin/mysql';
            }

            if (! File::exists($mysql)) {
                throw new \Exception('mysql not found at: '.$mysql);
            }

            Log::info('Backup restore: preparing mysql import', [
                'binary' => $mysql,
                'database' => $dbConfig['database'],
                'file_path' => $filePath,
                'host' => $dbConfig['host'],
                'port' => $dbConfig['port'],
                'user' => $dbConfig['username'],
            ]);

            $command = [
                $mysql,
                '-h'.$dbConfig['host'],
                '-P'.$dbConfig['port'],
                '-u'.$dbConfig['username'],
            ];

            if (! empty($dbConfig['password'])) {
                $command[] = '-p'.$dbConfig['password'];
            }

            $command[] = $dbConfig['database'];

            $shellCommand = implode(' ', array_map('escapeshellarg', $command)).' < '.escapeshellarg($filePath);
            Log::info('Backup restore: executing command', ['command' => $shellCommand]);

            $output = [];
            $returnCode = 0;
            \exec($shellCommand, $output, $returnCode);

            Log::info('Backup restore: command finished', [
                'return_code' => $returnCode,
                'output' => implode("\n", $output),
            ]);

            if ($returnCode !== 0) {
                throw new \Exception('mysql restore failed with code: '.$returnCode.' Output: '.implode("\n", $output));
            }
        } else {
            $this->restoreDatabaseManually($filePath);
        }
    }

    public function download($fileName)
    {
        $path = storage_path("app/backups/{$fileName}");

        if (! File::exists($path)) {
            return back()->with('error', 'File not found');
        }

        return response()->streamDownload(function () use ($path) {
            readfile($path);
        }, $fileName, [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ]);
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

    private function canUseShellExecution(): bool
    {
        return PHP_SAPI === 'cli' && function_exists('exec') && ! in_array('exec', array_map('trim', explode(',', (string) ini_get('disable_functions'))), true);
    }

    private function dumpDatabaseManually(string $backupPath): void
    {
        $dbConfig = $this->getDbConfig();
        $pdo = DB::connection()->getPdo();
        $tables = $pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);

        $sql = "-- Carding backup generated on ".now()->toDateTimeString()."\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            $tableSql = "DROP TABLE IF EXISTS `{$table}`;\n";
            $createRow = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_ASSOC);
            $createSql = $createRow['Create Table'] ?? null;

            if (! $createSql) {
                continue;
            }

            $sql .= $tableSql;
            $sql .= $createSql.";\n\n";

            $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(\PDO::FETCH_ASSOC);
            if (empty($rows)) {
                continue;
            }

            $columns = array_keys($rows[0]);
            $columnList = implode(', ', array_map(fn ($column) => '`'.$column.'`', $columns));

            foreach ($rows as $row) {
                $values = array_map([$this, 'quoteSqlValue'], array_values($row));
                $sql .= "INSERT INTO `{$table}` ({$columnList}) VALUES (".implode(', ', $values).");\n";
            }

            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        File::put($backupPath, $sql);
    }

    private function restoreDatabaseManually(string $filePath): void
    {
        $sql = File::get($filePath);
        $statements = preg_split('/;\s*(?:\r?\n|$)/', $sql) ?: [];

        DB::unprepared('SET FOREIGN_KEY_CHECKS=0');

        foreach ($statements as $statement) {
            $statement = trim($statement);
            if ($statement === '' || str_starts_with($statement, '--') || str_starts_with($statement, 'SET FOREIGN_KEY_CHECKS')) {
                continue;
            }

            DB::unprepared($statement);
        }

        DB::unprepared('SET FOREIGN_KEY_CHECKS=1');
    }

    private function quoteSqlValue(mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_numeric($value)) {
            return (string) $value;
        }

        return DB::getPdo()->quote((string) $value);
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
