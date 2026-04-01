<?php

namespace App\Jobs;

use App\Mail\ShippingNotification;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendShippingNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public Order $order,
    ) {}

    public function handle(): void
    {
        Mail::send(new ShippingNotification($this->order));

        $this->order->update([
            'shipping_notification_sent_at' => now(),
        ]);
    }
}
