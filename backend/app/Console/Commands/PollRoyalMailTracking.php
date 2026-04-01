<?php

namespace App\Console\Commands;

use App\Jobs\SendShippingNotification;
use App\Models\Order;
use App\Services\RoyalMailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PollRoyalMailTracking extends Command
{
    protected $signature = 'app:poll-royal-mail-tracking';

    protected $description = 'Poll Royal Mail API for tracking updates on fulfilled and shipped orders';

    public function handle(): int
    {
        $orders = Order::whereIn('status', ['fulfilled', 'shipped'])->get();

        if ($orders->isEmpty()) {
            $this->info('No orders to poll.');
            return Command::SUCCESS;
        }

        $royalMail = app(RoyalMailService::class);
        $consecutiveErrors = 0;

        foreach ($orders as $order) {
            if ($consecutiveErrors >= 5) {
                $this->warn('Circuit breaker activated after 5 consecutive errors - stopping.');
                Log::warning('Royal Mail tracking poller circuit breaker activated after 5 consecutive errors.');
                break;
            }

            try {
                $tracking = $royalMail->getOrderStatus($order->royal_mail_order_id);
                $consecutiveErrors = 0;

                if ($tracking->status === 'shipped' && $order->status !== 'shipped') {
                    $order->update([
                        'status' => 'shipped',
                        'tracking_number' => $tracking->trackingNumber,
                        'tracking_url' => $tracking->trackingUrl,
                        'shipped_at' => now(),
                    ]);

                    if (is_null($order->shipping_notification_sent_at)) {
                        SendShippingNotification::dispatch($order->fresh());
                    }

                    $this->info("Order {$order->order_number} updated to shipped.");
                } elseif ($tracking->status === 'delivered' && $order->status !== 'delivered') {
                    $order->update([
                        'status' => 'delivered',
                        'tracking_number' => $tracking->trackingNumber,
                        'tracking_url' => $tracking->trackingUrl,
                        'delivered_at' => now(),
                    ]);
                    $this->info("Order {$order->order_number} updated to delivered.");
                }
            } catch (\Throwable $e) {
                $consecutiveErrors++;
                Log::error('Royal Mail tracking poll failed', [
                    'order_number' => $order->order_number,
                    'exception' => $e->getMessage(),
                ]);
            }
        }

        return Command::SUCCESS;
    }
}
