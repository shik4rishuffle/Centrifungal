<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup {--disk=s3 : The filesystem disk to upload the backup to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a timestamped copy of the SQLite database and upload it to S3/R2';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dbPath = config('database.connections.sqlite.database');

        if (! file_exists($dbPath)) {
            $this->error("Database file not found at: {$dbPath}");
            return Command::FAILURE;
        }

        // Use SQLite's backup API via a .backup command to get a consistent copy.
        // This is safer than copying the file directly while the app is running.
        $timestamp = now()->format('Y-m-d_His');
        $backupFilename = "database-{$timestamp}.sqlite";
        $localBackupPath = "/tmp/{$backupFilename}";

        $this->info("Creating consistent backup via SQLite .backup command...");

        $result = exec(
            sprintf('sqlite3 %s ".backup %s" 2>&1', escapeshellarg($dbPath), escapeshellarg($localBackupPath)),
            $output,
            $exitCode
        );

        if ($exitCode !== 0) {
            $this->error("SQLite backup failed: " . implode("\n", $output));
            return Command::FAILURE;
        }

        if (! file_exists($localBackupPath)) {
            $this->error("Backup file was not created at: {$localBackupPath}");
            return Command::FAILURE;
        }

        $sizeBytes = filesize($localBackupPath);
        $sizeMb = round($sizeBytes / 1024 / 1024, 2);
        $this->info("Backup created: {$localBackupPath} ({$sizeMb} MB)");

        // Upload to the configured disk
        $disk = $this->option('disk');
        $remotePath = "backups/{$backupFilename}";

        $this->info("Uploading to {$disk}:/{$remotePath}...");

        try {
            Storage::disk($disk)->put(
                $remotePath,
                file_get_contents($localBackupPath)
            );
        } catch (\Throwable $e) {
            $this->error("Upload failed: {$e->getMessage()}");
            @unlink($localBackupPath);
            return Command::FAILURE;
        }

        // Clean up local temp file
        @unlink($localBackupPath);

        $this->info("Backup uploaded successfully to {$disk}:/{$remotePath}");

        // Prune old backups - keep the last 30 daily backups
        $this->pruneOldBackups($disk, 30);

        return Command::SUCCESS;
    }

    /**
     * Remove old backup files beyond the retention limit.
     */
    private function pruneOldBackups(string $disk, int $keep): void
    {
        $files = Storage::disk($disk)->files('backups');

        // Filter to only our database backup files
        $backups = collect($files)
            ->filter(fn (string $file) => str_starts_with(basename($file), 'database-'))
            ->sort()
            ->values();

        if ($backups->count() <= $keep) {
            return;
        }

        $toDelete = $backups->slice(0, $backups->count() - $keep);

        foreach ($toDelete as $file) {
            Storage::disk($disk)->delete($file);
            $this->info("Pruned old backup: {$file}");
        }
    }
}
