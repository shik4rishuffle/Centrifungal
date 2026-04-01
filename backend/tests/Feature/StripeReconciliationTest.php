<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Services\StripeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class StripeReconciliationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Build a fake Stripe checkout.session object representing a completed payment.
     */
    private function makeStripeSession(string $sessionId, ?string $paymentIntentId = null): array
    {
        return [
            'id' => $sessionId,
            'object' => 'checkout.session',
            'payment_status' => 'paid',
            'status' => 'complete',
            'payment_intent' => $paymentIntentId ?? 'pi_' . $sessionId,
            'customer_details' => [
                'name' => 'Test Customer',
                'email' => 'test@example.com',
            ],
            'shipping_details' => [
                'address' => [
                    'line1' => '1 Test Street',
                    'line2' => null,
                    'city' => 'London',
                    'state' => 'Greater London',
                    'postal_code' => 'E1 1AA',
                    'country' => 'GB',
                ],
            ],
            'amount_subtotal' => 2995,
            'amount_total' => 3390,
            'shipping_cost' => ['amount_total' => 395],
        ];
    }

    public function test_no_discrepancies_logs_zero_reconciled(): void
    {
        $sessionId = 'cs_test_existing001';

        Order::factory()->create([
            'stripe_checkout_session_id' => $sessionId,
            'status' => 'paid',
        ]);

        $this->mock(StripeService::class)
            ->shouldReceive('listCompletedSessions')
            ->once()
            ->andReturn([$this->makeStripeSession($sessionId)]);

        Log::shouldReceive('info')
            ->withArgs(fn (string $msg) => str_contains($msg, '0 orders reconciled'))
            ->once();

        Log::shouldReceive('info')->zeroOrMoreTimes();

        $this->artisan('app:reconcile-stripe-payments')
            ->assertExitCode(0);
    }

    public function test_missed_webhook_creates_order(): void
    {
        $sessionId = 'cs_test_missed001';

        $this->mock(StripeService::class)
            ->shouldReceive('listCompletedSessions')
            ->once()
            ->andReturn([$this->makeStripeSession($sessionId)]);

        $this->assertDatabaseCount('orders', 0);

        $this->artisan('app:reconcile-stripe-payments')
            ->assertExitCode(0);

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('orders', [
            'stripe_checkout_session_id' => $sessionId,
            'status' => 'paid',
        ]);
    }

    public function test_reconciled_orders_have_reconciled_at_set(): void
    {
        $sessionId = 'cs_test_reconat001';

        $this->mock(StripeService::class)
            ->shouldReceive('listCompletedSessions')
            ->once()
            ->andReturn([$this->makeStripeSession($sessionId)]);

        $this->artisan('app:reconcile-stripe-payments')
            ->assertExitCode(0);

        $order = Order::where('stripe_checkout_session_id', $sessionId)->firstOrFail();

        $this->assertNotNull($order->reconciled_at);
    }

    public function test_does_not_create_duplicate_orders(): void
    {
        $sessionId = 'cs_test_nodup001';

        Order::factory()->create([
            'stripe_checkout_session_id' => $sessionId,
            'status' => 'paid',
        ]);

        $this->mock(StripeService::class)
            ->shouldReceive('listCompletedSessions')
            ->once()
            ->andReturn([$this->makeStripeSession($sessionId)]);

        $this->artisan('app:reconcile-stripe-payments')
            ->assertExitCode(0);

        $this->assertDatabaseCount('orders', 1);
    }

    public function test_command_processes_max_50_sessions(): void
    {
        $sessions = [];
        for ($i = 1; $i <= 60; $i++) {
            $sessions[] = $this->makeStripeSession('cs_test_bulk' . str_pad((string) $i, 3, '0', STR_PAD_LEFT));
        }

        $this->mock(StripeService::class)
            ->shouldReceive('listCompletedSessions')
            ->once()
            ->andReturn($sessions);

        $this->artisan('app:reconcile-stripe-payments')
            ->assertExitCode(0);

        // Only 50 of the 60 sessions should have resulted in created orders.
        $this->assertDatabaseCount('orders', 50);
    }
}
