<?php

namespace Tests\Feature;

use App\Mail\OrderConfirmation;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderConfirmationEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirmation_email_is_sent_after_order_creation(): void
    {
        Mail::fake();

        $order = Order::factory()->paid()->create();

        Mail::assertSent(OrderConfirmation::class, function (OrderConfirmation $mail) use ($order) {
            return $mail->hasTo($order->customer_email);
        });
    }

    public function test_email_contains_correct_order_details(): void
    {
        $order = Order::factory()->paid()->create([
            'order_number' => 'CF-123456',
            'customer_email' => 'customer@example.com',
            'items_snapshot' => [
                [
                    'name' => 'Shiitake Grow Log - Medium',
                    'description' => 'Shiitake mushroom grow log',
                    'quantity' => 2,
                    'price_pence' => 2400,
                    'weight_grams' => 800,
                ],
            ],
            'subtotal_pence' => 4800,
            'shipping_pence' => 395,
            'total_pence' => 5195,
            'shipping_address' => [
                'line1' => '42 Spore Street',
                'line2' => null,
                'city' => 'Bristol',
                'county' => 'Avon',
                'postcode' => 'BS1 1AA',
            ],
        ]);

        $mailable = new OrderConfirmation($order);
        $html = $mailable->render();

        $this->assertStringContainsString('CF-123456', $html);
        $this->assertStringContainsString('Shiitake Grow Log - Medium', $html);
        $this->assertStringContainsString('42 Spore Street', $html);
    }

    public function test_email_failure_is_logged_but_order_still_exists(): void
    {
        Mail::fake();
        Mail::shouldReceive('send')->andThrow(new \Exception('Resend API unavailable'));

        Log::shouldReceive('error')
            ->once()
            ->withArgs(function (string $message) {
                return str_contains($message, 'order confirmation email');
            });

        $order = Order::factory()->paid()->create();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'paid',
        ]);
    }

    public function test_email_is_sent_to_customer_email_address(): void
    {
        Mail::fake();

        $order = Order::factory()->paid()->create([
            'customer_email' => 'mushroom.fan@example.com',
        ]);

        Mail::assertSent(OrderConfirmation::class, function (OrderConfirmation $mail) {
            return $mail->hasTo('mushroom.fan@example.com');
        });
    }
}
