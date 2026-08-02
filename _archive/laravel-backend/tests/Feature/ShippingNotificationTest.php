<?php

namespace Tests\Feature;

use App\DTOs\TrackingInfo;
use App\Jobs\SendShippingNotification;
use App\Mail\ShippingNotification;
use App\Models\Order;
use App\Services\RoyalMailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ShippingNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_shipping_notification_is_dispatched_when_order_ships(): void
    {
        Mail::fake();

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

        $this->artisan('app:poll-royal-mail-tracking')->assertExitCode(0);

        Mail::assertSent(ShippingNotification::class, function (ShippingNotification $mail) use ($order) {
            return $mail->hasTo($order->customer_email);
        });
    }

    public function test_email_contains_tracking_number_and_url(): void
    {
        $order = Order::factory()->shipped()->create([
            'tracking_number' => 'AB123456789GB',
            'tracking_url' => 'https://www.royalmail.com/track-your-item#/tracking-results/AB123456789GB',
        ]);

        $mailable = new ShippingNotification($order);
        $html = $mailable->render();

        $this->assertStringContainsString('AB123456789GB', $html);
        $this->assertStringContainsString('https://www.royalmail.com/track-your-item#/tracking-results/AB123456789GB', $html);
    }

    public function test_duplicate_notifications_are_prevented(): void
    {
        Mail::fake();

        $order = Order::factory()->create([
            'status' => 'fulfilled',
            'royal_mail_order_id' => 'RM-222222',
        ]);

        $trackingNumber = 'CD987654321GB';
        $trackingUrl = 'https://www.royalmail.com/track-your-item#/tracking-results/' . $trackingNumber;

        $trackingInfo = new TrackingInfo(
            trackingNumber: $trackingNumber,
            trackingUrl: $trackingUrl,
            status: 'shipped',
        );

        $this->mock(RoyalMailService::class)
            ->shouldReceive('getOrderStatus')
            ->twice()
            ->with('RM-222222')
            ->andReturn($trackingInfo);

        // First poll - transitions to shipped and sends notification
        $this->artisan('app:poll-royal-mail-tracking')->assertExitCode(0);

        // Second poll - order is already shipped, notification already sent
        $this->artisan('app:poll-royal-mail-tracking')->assertExitCode(0);

        Mail::assertSent(ShippingNotification::class, 1);
    }

    public function test_send_shipping_notification_job_retries_up_to_3_times(): void
    {
        $this->assertSame(3, (new SendShippingNotification(
            Order::factory()->shipped()->make()
        ))->tries);
    }
}
