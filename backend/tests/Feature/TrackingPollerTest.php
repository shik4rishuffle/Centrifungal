<?php

namespace Tests\Feature;

use App\DTOs\TrackingInfo;
use App\Models\Order;
use App\Services\RoyalMailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class TrackingPollerTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_runs_without_error_when_no_orders_need_polling(): void
    {
        $this->artisan('app:poll-royal-mail-tracking')
            ->assertExitCode(0);
    }

    public function test_order_with_new_tracking_gets_updated_to_shipped(): void
    {
        $order = Order::factory()->create([
            'status' => 'fulfilled',
            'royal_mail_order_id' => 'RM-111111',
        ]);

        $trackingNumber = 'AB123456789GB';
        $trackingUrl = 'https://www.royalmail.com/track-your-item#/tracking-results/' . $trackingNumber;

        $this->mock(RoyalMailService::class)
            ->shouldReceive('getOrderStatus')
            ->once()
            ->with('RM-111111')
            ->andReturn(new TrackingInfo(
                trackingNumber: $trackingNumber,
                trackingUrl: $trackingUrl,
                status: 'shipped',
            ));

        $this->artisan('app:poll-royal-mail-tracking')
            ->assertExitCode(0);

        $order->refresh();

        $this->assertSame('shipped', $order->status);
        $this->assertSame($trackingNumber, $order->tracking_number);
        $this->assertSame($trackingUrl, $order->tracking_url);
        $this->assertNotNull($order->shipped_at);
    }

    public function test_delivered_order_is_skipped(): void
    {
        Order::factory()->delivered()->create();

        $this->mock(RoyalMailService::class)
            ->shouldNotReceive('getOrderStatus');

        $this->artisan('app:poll-royal-mail-tracking')
            ->assertExitCode(0);
    }

    public function test_circuit_breaker_activates_after_5_consecutive_errors(): void
    {
        Order::factory()->count(6)->create([
            'status' => 'fulfilled',
            'royal_mail_order_id' => 'RM-999999',
        ]);

        $this->mock(RoyalMailService::class)
            ->shouldReceive('getOrderStatus')
            ->times(5)
            ->andThrow(new RuntimeException('API unavailable'));

        $this->artisan('app:poll-royal-mail-tracking')
            ->assertExitCode(0);
    }

    public function test_order_updated_to_delivered_when_status_indicates_delivery(): void
    {
        $order = Order::factory()->shipped()->create();

        $this->mock(RoyalMailService::class)
            ->shouldReceive('getOrderStatus')
            ->once()
            ->with($order->royal_mail_order_id)
            ->andReturn(new TrackingInfo(
                trackingNumber: $order->tracking_number,
                trackingUrl: $order->tracking_url,
                status: 'delivered',
            ));

        $this->artisan('app:poll-royal-mail-tracking')
            ->assertExitCode(0);

        $order->refresh();

        $this->assertSame('delivered', $order->status);
        $this->assertNotNull($order->delivered_at);
    }
}
