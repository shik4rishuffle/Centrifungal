<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\CartSession;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartApiTest extends TestCase
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

    public function test_add_item_with_valid_variant_returns_cart_with_one_item(): void
    {
        $variant = $this->createVariant(1200);

        $response = $this->postJson('/api/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $response->assertCreated();

        $response->assertJsonPath('data.items', fn (array $items) => count($items) === 1);
        $response->assertJsonPath('data.items.0.variant_id', $variant->id);
        $response->assertJsonPath('data.items.0.quantity', 2);
        $response->assertJsonPath('data.items.0.line_total_pence', 2400);
        $response->assertJsonPath('data.total_pence', 2400);
        $response->assertJsonStructure([
            'data' => [
                'cart_token',
                'expires_at',
                'items' => [
                    '*' => [
                        'id',
                        'variant_id',
                        'quantity',
                        'variant' => ['id', 'name', 'sku', 'price_pence', 'in_stock'],
                        'line_total_pence',
                    ],
                ],
                'total_pence',
            ],
        ]);
    }

    public function test_adding_same_variant_again_increments_quantity(): void
    {
        $variant = $this->createVariant(1000);

        // First add
        $first = $this->postJson('/api/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $first->assertCreated();
        $cartToken = $first->headers->get('X-Cart-Token');

        // Second add with same token
        $second = $this->postJson('/api/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 3,
        ], ['X-Cart-Token' => $cartToken]);

        $second->assertOk();
        $second->assertJsonPath('data.items', fn (array $items) => count($items) === 1);
        $second->assertJsonPath('data.items.0.quantity', 4);
        $second->assertJsonPath('data.items.0.line_total_pence', 4000);
        $second->assertJsonPath('data.total_pence', 4000);
    }

    public function test_patch_to_quantity_zero_removes_item(): void
    {
        $variant = $this->createVariant(800);

        // Add an item
        $addResponse = $this->postJson('/api/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 3,
        ]);

        $addResponse->assertCreated();
        $cartToken = $addResponse->headers->get('X-Cart-Token');
        $itemId = $addResponse->json('data.items.0.id');

        // Patch quantity to 0
        $patchResponse = $this->patchJson("/api/cart/items/{$itemId}", [
            'quantity' => 0,
        ], ['X-Cart-Token' => $cartToken]);

        $patchResponse->assertOk();
        $patchResponse->assertJsonPath('data.items', []);
        $patchResponse->assertJsonPath('data.total_pence', 0);
    }

    public function test_delete_removes_item_and_returns_updated_cart(): void
    {
        $variantA = $this->createVariant(500);
        $variantB = $this->createVariant(700);

        // Add first item
        $first = $this->postJson('/api/cart/items', [
            'variant_id' => $variantA->id,
            'quantity' => 1,
        ]);

        $first->assertCreated();
        $cartToken = $first->headers->get('X-Cart-Token');

        // Add second item
        $second = $this->postJson('/api/cart/items', [
            'variant_id' => $variantB->id,
            'quantity' => 2,
        ], ['X-Cart-Token' => $cartToken]);

        $second->assertOk();
        $itemToDeleteId = $second->json('data.items.0.id');

        // Identify which item is variantA so we can delete it
        $items = $second->json('data.items');
        $itemAId = null;
        foreach ($items as $item) {
            if ($item['variant_id'] === $variantA->id) {
                $itemAId = $item['id'];
                break;
            }
        }

        // Delete variantA's item
        $deleteResponse = $this->deleteJson("/api/cart/items/{$itemAId}", [], ['X-Cart-Token' => $cartToken]);

        $deleteResponse->assertOk();
        $deleteResponse->assertJsonPath('data.items', fn (array $items) => count($items) === 1);
        $deleteResponse->assertJsonPath('data.total_pence', 1400); // 700 * 2
    }

    public function test_get_empty_cart_returns_empty_items_and_zero_total(): void
    {
        $response = $this->getJson('/api/cart');

        $response->assertCreated();
        $response->assertJsonPath('data.items', []);
        $response->assertJsonPath('data.total_pence', 0);
        $response->assertJsonStructure([
            'data' => [
                'cart_token',
                'expires_at',
                'items',
                'total_pence',
            ],
        ]);
    }

    public function test_invalid_variant_id_returns_422(): void
    {
        $response = $this->postJson('/api/cart/items', [
            'variant_id' => 999999,
            'quantity' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_out_of_stock_variant_returns_422(): void
    {
        $variant = $this->createVariant(1000, inStock: false);

        $response = $this->postJson('/api/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_cart_token_persists_across_requests(): void
    {
        $variant = $this->createVariant(600);

        // First request - no token, should get one back
        $first = $this->postJson('/api/cart/items', [
            'variant_id' => $variant->id,
            'quantity' => 1,
        ]);

        $first->assertCreated();
        $cartToken = $first->headers->get('X-Cart-Token');
        $this->assertNotEmpty($cartToken);
        $this->assertEquals($cartToken, $first->json('data.cart_token'));

        // Second request - pass the token, should get the same cart
        $second = $this->getJson('/api/cart', ['X-Cart-Token' => $cartToken]);

        $second->assertOk();
        $this->assertEquals($cartToken, $second->headers->get('X-Cart-Token'));
        $this->assertEquals($cartToken, $second->json('data.cart_token'));
        $second->assertJsonPath('data.items', fn (array $items) => count($items) === 1);
        $second->assertJsonPath('data.items.0.quantity', 1);
    }
}
