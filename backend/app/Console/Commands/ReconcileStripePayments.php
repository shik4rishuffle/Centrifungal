<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\StripeService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReconcileStripePayments extends Command
{
    protected $signature = 'app:reconcile-stripe-payments';

    protected $description = 'Reconcile completed Stripe checkout sessions against local orders, creating any that were missed by webhooks';

    private const MAX_SESSIONS = 50;

    public function handle(): int
    {
        $stripe = app(StripeService::class);

        $sessions = array_slice($stripe->listCompletedSessions(), 0, self::MAX_SESSIONS);

        $reconciled = 0;

        foreach ($sessions as $session) {
            $sessionId = $session['id'] ?? null;

            if (! $sessionId) {
                continue;
            }

            if (Order::where('stripe_checkout_session_id', $sessionId)->exists()) {
                continue;
            }

            $this->createOrderFromSession($session);
            $reconciled++;
        }

        Log::info("Stripe reconciliation complete: {$reconciled} orders reconciled.");
        $this->info("Stripe reconciliation complete: {$reconciled} orders reconciled.");

        return Command::SUCCESS;
    }

    private function createOrderFromSession(array $session): void
    {
        $customerDetails = $session['customer_details'] ?? [];
        $shippingDetails = $session['shipping_details'] ?? [];

        $orderNumber = $this->generateOrderNumber();

        Order::create([
            'order_number' => $orderNumber,
            'stripe_checkout_session_id' => $session['id'],
            'stripe_payment_intent_id' => $session['payment_intent'] ?? null,
            'status' => 'paid',
            'customer_name' => $customerDetails['name'] ?? null,
            'customer_email' => $customerDetails['email'] ?? null,
            'shipping_address' => $shippingDetails['address'] ?? [],
            'items_snapshot' => [],
            'subtotal_pence' => $session['amount_subtotal'] ?? 0,
            'shipping_pence' => $session['shipping_cost']['amount_total'] ?? 0,
            'total_pence' => $session['amount_total'] ?? 0,
            'reconciled_at' => now(),
        ]);
    }

    private function generateOrderNumber(): string
    {
        $datePart = now()->format('Ymd');
        $todayCount = Order::where('order_number', 'like', "CF-{$datePart}-%")->count();
        $sequence = str_pad((string) ($todayCount + 1), 4, '0', STR_PAD_LEFT);

        return "CF-{$datePart}-{$sequence}";
    }
}
