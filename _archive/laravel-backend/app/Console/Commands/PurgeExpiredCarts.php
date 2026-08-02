<?php

namespace App\Console\Commands;

use App\Models\CartSession;
use Illuminate\Console\Command;

class PurgeExpiredCarts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cart:purge-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete cart sessions that have passed their expires_at timestamp';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = CartSession::where('expires_at', '<=', now())->count();

        CartSession::where('expires_at', '<=', now())
            ->each(function (CartSession $session) {
                $session->items()->delete();
                $session->delete();
            });

        $this->info("Purged {$count} expired cart session(s).");

        return Command::SUCCESS;
    }
}
