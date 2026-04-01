<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_products_returns_seeded_products_with_correct_json_structure(): void
    {
        $product = Product::factory()->create();
        ProductVariant::factory()->count(2)->create(['product_id' => $product->id]);

        $response = $this->getJson('/api/products');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'slug',
                    'category',
                    'base_price_pence',
                    'images',
                    'variants' => [
                        '*' => [
                            'id',
                            'name',
                            'sku',
                            'price_pence',
                            'weight_grams',
                            'in_stock',
                            'sort_order',
                        ],
                    ],
                ],
            ],
            'links',
            'meta',
        ]);

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $product->id);
        $response->assertJsonPath('data.0.name', $product->name);
        $response->assertJsonPath('data.0.slug', $product->slug);
        $response->assertJsonCount(2, 'data.0.variants');

        // description should NOT be present on the list endpoint
        $response->assertJsonMissingPath('data.0.description');
    }

    public function test_list_products_filters_by_category(): void
    {
        Product::factory()->create(['category' => 'grow-logs']);
        Product::factory()->create(['category' => 'grow-logs']);
        Product::factory()->create(['category' => 'substrates']);

        $response = $this->getJson('/api/products?category=grow-logs');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');

        $categories = collect($response->json('data'))->pluck('category')->unique()->values()->all();
        $this->assertSame(['grow-logs'], $categories);
    }

    public function test_show_product_returns_single_product_with_variants(): void
    {
        $product = Product::factory()->create(['slug' => 'shiitake-grow-log']);
        ProductVariant::factory()->count(3)->create(['product_id' => $product->id]);

        $response = $this->getJson('/api/products/shiitake-grow-log');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'slug',
                'category',
                'base_price_pence',
                'images',
                'description',
                'variants' => [
                    '*' => [
                        'id',
                        'name',
                        'sku',
                        'price_pence',
                        'weight_grams',
                        'in_stock',
                        'sort_order',
                    ],
                ],
            ],
        ]);

        $response->assertJsonPath('data.id', $product->id);
        $response->assertJsonPath('data.slug', 'shiitake-grow-log');
        $response->assertJsonPath('data.description', $product->description);
        $response->assertJsonCount(3, 'data.variants');
    }

    public function test_categories_endpoint_returns_category_list_with_counts(): void
    {
        Product::factory()->count(3)->create(['category' => 'grow-logs']);
        Product::factory()->count(2)->create(['category' => 'substrates']);
        Product::factory()->create(['category' => 'accessories']);

        $response = $this->getJson('/api/products/categories');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'category',
                    'product_count',
                ],
            ],
        ]);

        $response->assertJsonCount(3, 'data');

        // Categories are ordered alphabetically
        $data = $response->json('data');
        $this->assertSame('accessories', $data[0]['category']);
        $this->assertEquals(1, $data[0]['product_count']);
        $this->assertSame('grow-logs', $data[1]['category']);
        $this->assertEquals(3, $data[1]['product_count']);
        $this->assertSame('substrates', $data[2]['category']);
        $this->assertEquals(2, $data[2]['product_count']);
    }

    public function test_inactive_products_are_excluded_from_all_responses(): void
    {
        $active = Product::factory()->create([
            'is_active' => true,
            'category' => 'grow-logs',
        ]);
        $inactive = Product::factory()->create([
            'is_active' => false,
            'slug' => 'inactive-product',
            'category' => 'discontinued',
        ]);

        // Excluded from list
        $response = $this->getJson('/api/products');
        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $active->id);

        // Excluded from show - returns 404
        $response = $this->getJson('/api/products/inactive-product');
        $response->assertNotFound();

        // Excluded from category counts - inactive-only category should not appear
        $response = $this->getJson('/api/products/categories');
        $response->assertOk();
        $categories = collect($response->json('data'))->pluck('category')->all();
        $this->assertNotContains('discontinued', $categories);
        $this->assertContains('grow-logs', $categories);
    }

    public function test_nonexistent_slug_returns_404_with_json_error(): void
    {
        $response = $this->getJson('/api/products/nonexistent');

        $response->assertNotFound();
        $response->assertJson([
            'message' => 'Product not found.',
        ]);
    }
}
