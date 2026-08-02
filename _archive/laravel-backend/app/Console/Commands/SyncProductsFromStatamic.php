<?php

namespace App\Console\Commands;

use App\Listeners\SyncProductToDatabase;
use Illuminate\Console\Command;
use Statamic\Events\EntrySaved;
use Statamic\Facades\Entry;

class SyncProductsFromStatamic extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:sync-products';

    /**
     * The console command description.
     */
    protected $description = 'Bulk-sync all Statamic product entries to the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $entries = Entry::whereCollection('products');
        $count = $entries->count();

        if ($count === 0) {
            $this->info('No product entries found in Statamic.');

            return self::SUCCESS;
        }

        $this->info("Syncing {$count} product(s) to the database...");

        $listener = new SyncProductToDatabase();
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $failed = 0;

        foreach ($entries as $entry) {
            try {
                $listener->handleSaved(new EntrySaved($entry));
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error("Failed to sync '{$entry->slug()}': {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $synced = $count - $failed;
        $this->info("Done. {$synced} product(s) synced successfully.");

        if ($failed > 0) {
            $this->warn("{$failed} product(s) failed to sync. Check the logs for details.");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
