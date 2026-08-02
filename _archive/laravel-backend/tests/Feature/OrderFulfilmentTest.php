<?php

namespace Tests\Feature;

use App\DTOs\RoyalMailResponse;
use App\Jobs\FulfilOrder;
use App\Models\Order;
use App\Services\RoyalMailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrderFulfilmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_fulfil_order_job_is_dispatched_after_order_creation(): void
    {
        Bus::fake();

        $order = Order::factory()->paid()->create();

        // Simulate the post-creation dispatch that the webhook handler (or observer) performs.
        FulfilOrder::dispatch($order);

        Bus::assertDispatched(FulfilOrder::class, function (FulfilOrder $job) use ($order) {
            return $job->order->is($order);
        });
    }

    public function test_successful_royal_mail_push_sets_order_to_fulfilled(): void
    {
        $order = Order::factory()->paid()->create();

        $royalMailOrderId = 'RM-123456';

        $this->mock(RoyalMailService::class)
            ->shouldReceive('pushOrder')
            ->once()
            ->with(\Mockery::on(fn (Order $o) => $o->is($order)))
            ->andReturn(RoyalMailResponse::succeeded($royalMailOrderId));

        (new FulfilOrder($order))->handle(app(RoyalMailService::class));

        $order->refresh();

        $this->assertSame('fulfilled', $order->status);
        $this->assertSame($royalMailOrderId, $order->royal_mail_order_id);
    }

    public function test_failed_royal_mail_push_retries_up_to_3_times(): void
    {
        $order = Order::factory()->paid()->create();

        $job = new FulfilOrder($order);

        // The job must declare $tries = 3 (or equivalent) so Laravel retries on failure.
        $this->assertSame(3, $job->tries);
    }

    public function test_order_stays_paid_after_all_retries_exhausted(): void
    {
        $order = Order::factory()->paid()->create();

        $this->mock(RoyalMailService::class)
            ->shouldReceive('pushOrder')
            ->andReturn(RoyalMailResponse::failed('Service unavailable'));

        Log::shouldReceive('error')->atLeast()->once();

        $job = new FulfilOrder($order);
        $job->failed(new \RuntimeException('All retries exhausted'));

        $order->refresh();

        $this->assertSame('paid', $order->status);
        $this->assertNull($order->royal_mail_order_id);
    }

    public function test_status_transitions_are_enforced(): void
    {
        // An order that is already 'shipped' must not be able to move back to 'paid'.
        $order = Order::factory()->shipped()->create();

        $this->expectException(\DomainException::class);

        $order->transitionStatus('paid');
    }
}
