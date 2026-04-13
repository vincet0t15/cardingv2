<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BackupController extends Controller
{
    /**
     * Display backup management page
     */
    public function index(Request $request)
    {
        $backups = $this->getBackups($request);

        return Inertia::render('settings/Backup', [
            'backups' => $backups['data'],
            'pagination' => [
                'current_page' => $backups['current_page'],
                'last_page' => $backups['last_page'],
                'per_page' => $backups['per_page'],
                'total' => $backups['total'],
            ],
            'databaseName' => config('database.connections.mysql.database'),
        ]);
    }

    /**
     * Create a new database backup
     */
    public function create(Request $request)
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $fileName = "backup_{$timestamp}.sql";
            $backupPath = storage_path("app/backups/{$fileName}");

            File::ensureDirectoryExists(storage_path('app/backups'));

            $command = $this->buildMySqlDumpCommand($backupPath);
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                Log::error('Backup creation failed');
                throw new \Exception('Failed to create database backup');
            }

            if (!File::exists($backupPath) || File::size($backupPath) === 0) {
                throw new \Exception('Backup file was not created or is empty');
            }

            return redirect()->back()->with('success', 'Database backup created successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to create backup: ' . $e->getMessage());
        }
    }

    /**
     * Download a backup file
     */
    public function download($fileName)
    {
        $path = storage_path("app/backups/{$fileName}");

        if (!File::exists($path)) {
            return back()->with('error', 'Backup file not found');
        }

        return response()->download($path);
    }

    /**
     * Delete a backup file
     */
    public function destroy($fileName)
    {
        $path = storage_path("app/backups/{$fileName}");

        if (!File::exists($path)) {
            return back()->with('error', 'Backup file not found');
        }

        File::delete($path);

        return back()->with('success', 'Backup deleted successfully!');
    }

    /**
     * Restore database from backup
     */
    public function restore(Request $request)
    {
        $request->validate([
            'file_name' => 'required|string',
        ]);

        try {
            $fileName = $request->input('file_name');
            $backupPath = storage_path("app/backups/{$fileName}");

            if (!File::exists($backupPath)) {
                return back()->with('error', 'Backup file not found');
            }

            $sqlContent = File::get($backupPath);

            if (empty($sqlContent)) {
                throw new \Exception('Backup file is empty');
            }

            $this->executeMySqlRestore($sqlContent);
            $this->clearCachesAndDisconnect();

            return back()->with('success', 'Database restored successfully! The page will reload with fresh data.');
        } catch (\Exception $e) {
            Log::error('Database restore failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to restore database: ' . $e->getMessage());
        }
    }

    /**
     * Upload and restore from uploaded file
     */
    public function uploadRestore(Request $request)
    {
        $request->validate([
            'backup_file' => [
                'required',
                'file',
                'max:102400',
                function ($attribute, $value, $fail) {
                    $extension = strtolower($value->getClientOriginalExtension());
                    $allowedExtensions = ['sql', 'zip', 'gz'];

                    if (!in_array($extension, $allowedExtensions)) {
                        $fail('The backup file must be a file of type: sql, zip, gz.');
                    }
                },
            ],
        ]);

        try {
            $file = $request->file('backup_file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $tempPath = storage_path("app/temp/{$fileName}");

            File::ensureDirectoryExists(storage_path('app/temp'));
            $file->move(storage_path('app/temp'), $fileName);

            $sqlContent = File::get($tempPath);

            if (empty($sqlContent)) {
                File::delete($tempPath);
                throw new \Exception('Uploaded backup file is empty');
            }

            $this->executeMySqlRestore($sqlContent);
            File::delete($tempPath);
            $this->clearCachesAndDisconnect();

            return back()->with('success', 'Database restored from uploaded file successfully! The page will reload with fresh data.');
        } catch (\Exception $e) {
            Log::error('Upload restore failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to restore database: ' . $e->getMessage());
        }
    }

    /**
     * Get list of available backups
     */
    private function getBackups(Request $request): array
    {
        $backupDir = storage_path('app/backups');

        if (!File::exists($backupDir)) {
            return [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 15,
                'total' => 0,
            ];
        }

        $files = File::files($backupDir);
        $backups = [];

        foreach ($files as $file) {
            $dateTime = new \DateTime();
            $dateTime->setTimestamp($file->getMTime());
            $dateTime->setTimezone(new \DateTimeZone('Asia/Manila'));

            $backups[] = [
                'name' => $file->getFilename(),
                'size' => $this->formatFileSize($file->getSize()),
                'date' => $dateTime->format('Y-m-d g:i:s A'),
                'path' => $file->getPathname(),
            ];
        }

        usort($backups, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($startDate) {
            $backups = array_filter($backups, function ($backup) use ($startDate) {
                return strtotime($backup['date']) >= strtotime($startDate . ' 00:00:00');
            });
        }

        if ($endDate) {
            $backups = array_filter($backups, function ($backup) use ($endDate) {
                return strtotime($backup['date']) <= strtotime($endDate . ' 23:59:59');
            });
        }

        $backups = array_values($backups);

        $perPage = 15;
        $currentPage = (int) $request->input('page', 1);
        $total = count($backups);
        $lastPage = (int) ceil($total / $perPage);

        if ($currentPage < 1) {
            $currentPage = 1;
        }
        if ($currentPage > $lastPage && $lastPage > 0) {
            $currentPage = $lastPage;
        }

        $offset = ($currentPage - 1) * $perPage;
        $paginatedBackups = array_slice($backups, $offset, $perPage);

        return [
            'data' => $paginatedBackups,
            'current_page' => $currentPage,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
        ];
    }

    /**
     * Build mysqldump command for backup creation
     */
    private function buildMySqlDumpCommand(string $backupPath): string
    {
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        return sprintf(
            'mysqldump --user=%s --password=%s --host=%s --port=%s --add-drop-table --routines --triggers %s > "%s" 2>&1',
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($database),
            $backupPath
        );
    }

    /**
     * Execute MySQL restore using proc_open
     */
    private function executeMySqlRestore(string $sqlContent): void
    {
        $mysqlPath = $this->getMySqlPath();
        $dbConfig = $this->getDatabaseConfig();

        $errorFile = tempnam(sys_get_temp_dir(), 'mysql_error_');

        $descriptorspec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['file', $errorFile, 'w'],
        ];

        $process = proc_open(
            sprintf(
                '%s --user=%s --password=%s --host=%s --port=%s --force %s',
                escapeshellarg($mysqlPath),
                escapeshellarg($dbConfig['username']),
                escapeshellarg($dbConfig['password']),
                escapeshellarg($dbConfig['host']),
                escapeshellarg($dbConfig['port']),
                escapeshellarg($dbConfig['database'])
            ),
            $descriptorspec,
            $pipes
        );

        if (!is_resource($process)) {
            throw new \Exception('Failed to start MySQL process');
        }

        fwrite($pipes[0], $sqlContent);
        fclose($pipes[0]);

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $returnCode = proc_close($process);
        $errorOutput = file_exists($errorFile) ? file_get_contents($errorFile) : '';

        @unlink($errorFile);

        if ($returnCode !== 0) {
            Log::error('MySQL restore failed');
            throw new \Exception('Failed to restore database');
        }
    }

    /**
     * Clear Laravel caches and disconnect database
     */
    private function clearCachesAndDisconnect(): void
    {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('view:clear');
        Artisan::call('event:clear');
        Artisan::call('route:clear');

        DB::disconnect();
    }

    /**
     * Get MySQL executable path
     */
    private function getMySqlPath(): string
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
            return 'mysql';
        }

        $possiblePaths = [
            'C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysql.exe',
            'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysql.exe',
            'C:\\xampp\\mysql\\bin\\mysql.exe',
            'C:\\wamp\\bin\\mysql\\mysql8.0.27\\bin\\mysql.exe',
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        return 'mysql';
    }

    /**
     * Get database configuration
     */
    private function getDatabaseConfig(): array
    {
        return [
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port'),
            'database' => config('database.connections.mysql.database'),
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
        ];
    }

    /**
     * Format file size to human readable format
     */
    private function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
