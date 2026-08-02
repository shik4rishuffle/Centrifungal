<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\RoyalMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FulfilOrder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public Order $order,
    ) {}

    public function handle(RoyalMailService $royalMailService): void
    {
        $response = $royalMailService->pushOrder($this->order);

        if ($response->success) {
            $this->order->transitionStatus('fulfilled');
            $this->order->royal_mail_order_id = $response->orderId;
            $this->order->save();
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('FulfilOrder job failed', [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'error' => $exception->getMessage(),
        ]);
    }
}
