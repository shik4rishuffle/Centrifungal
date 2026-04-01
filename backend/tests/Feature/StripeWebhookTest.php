<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\CartSession;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK_URL = '/webhook/stripe';

    /**
     * Build a realistic checkout.session.completed Stripe webhook payload.
     *
     * @param string $sessionId The Stripe checkout session ID to embed.
     * @param string $cartToken The cart session token stored in client_reference_id.
     */
    private function buildCheckoutPayload(string $sessionId, string $cartToken): array
    {
        return [
            'id' => 'evt_test_' . $sessionId,
            'object' => 'event',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => $sessionId,
                    'object' => 'checkout.session',
                    'payment_intent' => 'pi_test_3xAmple000000000001',
                    'payment_status' => 'paid',
                    'status' => 'complete',
                    'client_reference_id' => $cartToken,
                    'customer_details' => [
                        'name' => 'Jane Doe',
                        'email' => 'jane.doe@example.com',
                    ],
                    'shipping_details' => [
                        'name' => 'Jane Doe',
                        'address' => [
                            'line1' => '10 Downing Street',
                            'line2' => null,
                            'city' => 'London',
                            'state' => 'Greater London',
                            'postal_code' => 'SW1A 2AA',
                            'country' => 'GB',
                        ],
                    ],
                    'amount_subtotal' => 2995,
                    'amount_total' => 3390,
                    'shipping_cost' => [
                        'amount_total' => 395,
                    ],
                ],
            ],
        ];
    }

    /**
     * Create a cart session with two items and return the session plus its token.
     */
    private function createCartWithItems(): CartSession
    {
        $variantA = ProductVariant::factory()->create(['price_pence' => 1500]);
        $variantB = ProductVariant::factory()->create(['price_pence' => 1495]);

        $cart = CartSession::factory()->create();

        CartItem::factory()->create([
            'cart_session_id' => $cart->id,
            'product_variant_id' => $variantA->id,
            'quantity' => 1,
        ]);

        CartItem::factory()->create([
            'cart_session_id' => $cart->id,
            'product_variant_id' => $variantB->id,
            'quantity' => 1,
        ]);

        return $cart;
    }

    public function test_valid_webhook_creates_order_record(): void
    {
        $cart = $this->createCartWithItems();
        $sessionId = 'cs_test_valid0001';
        $payload = $this->buildCheckoutPayload($sessionId, $cart->session_token);

        $response = $this->withoutMiddleware()
            ->postJson(self::WEBHOOK_URL, $payload);

        $response->assertOk();
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('orders', [
            'stripe_checkout_session_id' => $sessionId,
        ]);
    }

    public function test_duplicate_webhook_returns_200_without_duplicate_order(): void
    {
        $sessionId = 'cs_test_duplicate001';

        Order::factory()->create([
            'stripe_checkout_session_id' => $sessionId,
        ]);

        $cart = $this->createCartWithItems();
        $payload = $this->buildCheckoutPayload($sessionId, $cart->session_token);

        $response = $this->withoutMiddleware()
            ->postJson(self::WEBHOOK_URL, $payload);

        $response->assertOk();
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_invalid_signature_returns_400(): void
    {
        $cart = $this->createCartWithItems();
        $payload = $this->buildCheckoutPayload('cs_test_badsig001', $cart->session_token);

        // Post without bypassing middleware - supply a clearly invalid signature header.
        $response = $this->postJson(
            self::WEBHOOK_URL,
            $payload,
            ['Stripe-Signature' => 'invalid']
        );

        $response->assertStatus(400);
    }

    public function test_order_contains_correct_details_and_items_snapshot(): void
    {
        $cart = $this->createCartWithItems();
        $sessionId = 'cs_test_details001';
        $payload = $this->buildCheckoutPayload($sessionId, $cart->session_token);

        $this->withoutMiddleware()
            ->postJson(self::WEBHOOK_URL, $payload)
            ->assertOk();

        $order = Order::where('stripe_checkout_session_id', $sessionId)->firstOrFail();

        $this->assertSame('Jane Doe', $order->customer_name);
        $this->assertSame('jane.doe@example.com', $order->customer_email);

        // items_snapshot should be a non-empty array of line items.
        $this->assertIsArray($order->items_snapshot);
        $this->assertNotEmpty($order->items_snapshot);

        foreach ($order->items_snapshot as $item) {
            $this->assertArrayHasKey('name', $item);
            $this->assertArrayHasKey('quantity', $item);
            $this->assertArrayHasKey('price_pence', $item);
        }

        // Totals stored in pence as reported by Stripe.
        $this->assertSame(2995, $order->subtotal_pence);
        $this->assertSame(395, $order->shipping_pence);
        $this->assertSame(3390, $order->total_pence);
    }

    public function test_order_number_follows_cf_date_format(): void
    {
        $cart = $this->createCartWithItems();
        $sessionId = 'cs_test_ordnum001';
        $payload = $this->buildCheckoutPayload($sessionId, $cart->session_token);

        $this->withoutMiddleware()
            ->postJson(self::WEBHOOK_URL, $payload)
            ->assertOk();

        $order = Order::where('stripe_checkout_session_id', $sessionId)->firstOrFail();

        $this->assertMatchesRegularExpression('/^CF-\d{8}-\d{4}$/', $order->order_number);
    }

    public function test_cart_is_cleared_after_order_creation(): void
    {
        $cart = $this->createCartWithItems();
        $sessionId = 'cs_test_cartclear01';

        // Confirm items exist before the webhook fires.
        $this->assertDatabaseCount('cart_items', 2);

        $payload = $this->buildCheckoutPayload($sessionId, $cart->session_token);

        $this->withoutMiddleware()
            ->postJson(self::WEBHOOK_URL, $payload)
            ->assertOk();

        $this->assertDatabaseCount('cart_items', 0);
    }
}
