<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\CartSession;
use App\Models\ProductVariant;
use App\Services\StripeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class CheckoutApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create an in-stock variant with a known price for deterministic assertions.
     */
    private function createVariant(int $pricePence = 1500, bool $inStock = true): ProductVariant
    {
        return ProductVariant::factory()->create([
            'price_pence' => $pricePence,
            'in_stock' => $inStock,
        ]);
    }

    /**
     * Create a cart session with a known token and return it along with the token string.
     */
    private function createCartSession(): CartSession
    {
        return CartSession::factory()->create();
    }

    public function test_checkout_with_valid_cart_returns_checkout_url(): void
    {
        $cart = $this->createCartSession();
        $variant = $this->createVariant(2000);

        CartItem::factory()->create([
            'cart_session_id' => $cart->id,
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $fakeUrl = 'https://checkout.stripe.com/pay/cs_test_fake123';

        $this->mock(StripeService::class, function (MockInterface $mock) use ($fakeUrl) {
            $mock->shouldReceive('createCheckoutSession')
                ->once()
                ->andReturn($fakeUrl);
        });

        $response = $this->postJson('/api/checkout', [], [
            'X-Cart-Token' => $cart->session_token,
        ]);

        $response->assertOk();
        $response->assertJsonPath('checkout_url', $fakeUrl);
    }

    public function test_empty_cart_returns_422(): void
    {
        $cart = $this->createCartSession();

        $response = $this->postJson('/api/checkout', [], [
            'X-Cart-Token' => $cart->session_token,
        ]);

        $response->assertStatus(422);
    }

    public function test_out_of_stock_item_returns_422(): void
    {
        $cart = $this->createCartSession();
        $outOfStockVariant = $this->createVariant(1200, inStock: false);

        CartItem::factory()->create([
            'cart_session_id' => $cart->id,
            'product_variant_id' => $outOfStockVariant->id,
            'quantity' => 1,
        ]);

        $response = $this->postJson('/api/checkout', [], [
            'X-Cart-Token' => $cart->session_token,
        ]);

        $response->assertStatus(422);
    }

    public function test_stripe_service_receives_correct_line_items_and_metadata(): void
    {
        $cart = $this->createCartSession();

        $variantA = ProductVariant::factory()->create([
            'name' => 'Shiitake Small',
            'price_pence' => 1500,
            'in_stock' => true,
        ]);
        $variantB = ProductVariant::factory()->create([
            'name' => 'Oyster Large',
            'price_pence' => 2500,
            'in_stock' => true,
        ]);

        CartItem::factory()->create([
            'cart_session_id' => $cart->id,
            'product_variant_id' => $variantA->id,
            'quantity' => 2,
        ]);
        CartItem::factory()->create([
            'cart_session_id' => $cart->id,
            'product_variant_id' => $variantB->id,
            'quantity' => 1,
        ]);

        $capturedLineItems = null;
        $capturedMetadata = null;

        $this->mock(StripeService::class, function (MockInterface $mock) use ($cart, &$capturedLineItems, &$capturedMetadata) {
            $mock->shouldReceive('createCheckoutSession')
                ->once()
                ->withArgs(function (array $lineItems, array $metadata) use ($cart, &$capturedLineItems, &$capturedMetadata) {
                    $capturedLineItems = $lineItems;
                    $capturedMetadata = $metadata;
                    return true;
                })
                ->andReturn('https://checkout.stripe.com/pay/cs_test_fake456');
        });

        $this->postJson('/api/checkout', [], [
            'X-Cart-Token' => $cart->session_token,
        ]);

        $this->assertNotNull($capturedLineItems, 'StripeService::createCheckoutSession was not called');

        // Verify line items contain expected product names, prices, and quantities
        $names = array_column($capturedLineItems, 'name');
        $this->assertContains('Shiitake Small', $names);
        $this->assertContains('Oyster Large', $names);

        $shiitakeItem = collect($capturedLineItems)->firstWhere('name', 'Shiitake Small');
        $oysterItem = collect($capturedLineItems)->firstWhere('name', 'Oyster Large');

        $this->assertEquals(1500, $shiitakeItem['price_pence']);
        $this->assertEquals(2, $shiitakeItem['quantity']);

        $this->assertEquals(2500, $oysterItem['price_pence']);
        $this->assertEquals(1, $oysterItem['quantity']);

        // Verify cart session ID is passed in metadata
        $this->assertArrayHasKey('cart_session_id', $capturedMetadata);
        $this->assertEquals($cart->id, $capturedMetadata['cart_session_id']);
    }

    public function test_invalid_cart_token_returns_401_or_404(): void
    {
        $response = $this->postJson('/api/checkout', [], [
            'X-Cart-Token' => 'totally-invalid-token-that-does-not-exist',
        ]);

        $this->assertContains($response->status(), [401, 404]);
    }
}
