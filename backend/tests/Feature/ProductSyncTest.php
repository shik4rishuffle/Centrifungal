<?php

namespace Tests\Feature;

use App\Listeners\SyncProductToDatabase;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Mockery;
use Statamic\Events\EntryDeleted;
use Statamic\Events\EntrySaved;
use Tests\TestCase;

class ProductSyncTest extends TestCase
{
    use RefreshDatabase;

    private SyncProductToDatabase $listener;

    protected function setUp(): void
    {
        parent::setUp();

        $this->listener = new SyncProductToDatabase();
    }

    public function test_saving_product_entry_syncs_to_database(): void
    {
        $entry = $this->makeFakeEntry('shiitake-grow-log', [
            'name' => 'Shiitake Grow Log',
            'price' => 1299,
            'category' => 'grow-logs',
            'in_stock' => true,
            'weight_grams' => 850,
            'images' => ['products/shiitake-01.jpg'],
            'description' => 'A great shiitake log.',
            'sizes_variants' => [
                [
                    'type' => 'variant',
                    'variant_name' => 'Small',
                    'sku' => 'GL-SHI-SM',
                    'price_override' => null,
                    'in_stock' => true,
                ],
                [
                    'type' => 'variant',
                    'variant_name' => 'Large',
                    'sku' => 'GL-SHI-LG',
                    'price_override' => 1999,
                    'in_stock' => true,
                ],
            ],
        ]);

        $this->listener->handleSaved(new EntrySaved($entry));

        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseHas('products', [
            'statamic_id' => $entry->id(),
            'name' => 'Shiitake Grow Log',
            'slug' => 'shiitake-grow-log',
            'category' => 'grow-logs',
            'base_price_pence' => 1299,
            'is_active' => true,
        ]);

        $this->assertDatabaseCount('product_variants', 2);
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'GL-SHI-SM',
            'name' => 'Small',
            'price_pence' => 1299,
            'weight_grams' => 850,
        ]);
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'GL-SHI-LG',
            'name' => 'Large',
            'price_pence' => 1999,
            'weight_grams' => 850,
        ]);
    }

    public function test_updating_product_entry_updates_database(): void
    {
        $entryId = (string) Str::uuid();

        $entry = $this->makeFakeEntry('oyster-kit', [
            'name' => 'Oyster Kit',
            'price' => 999,
            'category' => 'diy-kits',
            'in_stock' => true,
            'weight_grams' => 400,
            'images' => ['products/oyster-01.jpg'],
            'description' => 'A DIY oyster kit.',
            'sizes_variants' => [],
        ], $entryId);

        $this->listener->handleSaved(new EntrySaved($entry));

        $this->assertDatabaseHas('products', [
            'statamic_id' => $entryId,
            'name' => 'Oyster Kit',
            'base_price_pence' => 999,
        ]);

        // Simulate updating the entry with a new mock using the same ID
        $updatedEntry = $this->makeFakeEntry('oyster-kit', [
            'name' => 'Oyster Mushroom Kit',
            'price' => 1199,
            'category' => 'diy-kits',
            'in_stock' => true,
            'weight_grams' => 400,
            'images' => ['products/oyster-01.jpg'],
            'description' => 'An updated DIY oyster kit.',
            'sizes_variants' => [],
        ], $entryId);

        $this->listener->handleSaved(new EntrySaved($updatedEntry));

        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseHas('products', [
            'statamic_id' => $entryId,
            'name' => 'Oyster Mushroom Kit',
            'base_price_pence' => 1199,
        ]);
    }

    public function test_deleting_product_entry_deactivates_in_database(): void
    {
        $entryId = (string) Str::uuid();

        $entry = $this->makeFakeEntry('reishi-log', [
            'name' => 'Reishi Log',
            'price' => 1599,
            'category' => 'grow-logs',
            'in_stock' => true,
            'weight_grams' => 1200,
            'images' => [],
            'description' => 'A reishi log.',
            'sizes_variants' => [
                [
                    'type' => 'variant',
                    'variant_name' => 'Standard',
                    'sku' => 'GL-REI-STD',
                    'price_override' => null,
                    'in_stock' => true,
                ],
            ],
        ], $entryId);

        $this->listener->handleSaved(new EntrySaved($entry));

        $this->assertDatabaseHas('products', [
            'statamic_id' => $entryId,
            'is_active' => true,
        ]);
        $this->assertDatabaseCount('product_variants', 1);

        $this->listener->handleDeleted(new EntryDeleted($entry));

        $this->assertDatabaseHas('products', [
            'statamic_id' => $entryId,
            'is_active' => false,
        ]);
        $this->assertDatabaseCount('product_variants', 0);
    }

    public function test_variant_orphan_cleanup(): void
    {
        $entryId = (string) Str::uuid();

        $entry = $this->makeFakeEntry('lions-mane-block', [
            'name' => 'Lions Mane Block',
            'price' => 1499,
            'category' => 'grow-logs',
            'in_stock' => true,
            'weight_grams' => 700,
            'images' => [],
            'description' => 'A lions mane block.',
            'sizes_variants' => [
                [
                    'type' => 'variant',
                    'variant_name' => 'Small',
                    'sku' => 'GL-LM-SM',
                    'price_override' => null,
                    'in_stock' => true,
                ],
                [
                    'type' => 'variant',
                    'variant_name' => 'Medium',
                    'sku' => 'GL-LM-MD',
                    'price_override' => 1699,
                    'in_stock' => true,
                ],
                [
                    'type' => 'variant',
                    'variant_name' => 'Large',
                    'sku' => 'GL-LM-LG',
                    'price_override' => 1999,
                    'in_stock' => true,
                ],
            ],
        ], $entryId);

        $this->listener->handleSaved(new EntrySaved($entry));
        $this->assertDatabaseCount('product_variants', 3);

        // Remove the Medium variant
        $updatedEntry = $this->makeFakeEntry('lions-mane-block', [
            'name' => 'Lions Mane Block',
            'price' => 1499,
            'category' => 'grow-logs',
            'in_stock' => true,
            'weight_grams' => 700,
            'images' => [],
            'description' => 'A lions mane block.',
            'sizes_variants' => [
                [
                    'type' => 'variant',
                    'variant_name' => 'Small',
                    'sku' => 'GL-LM-SM',
                    'price_override' => null,
                    'in_stock' => true,
                ],
                [
                    'type' => 'variant',
                    'variant_name' => 'Large',
                    'sku' => 'GL-LM-LG',
                    'price_override' => 1999,
                    'in_stock' => true,
                ],
            ],
        ], $entryId);

        $this->listener->handleSaved(new EntrySaved($updatedEntry));

        $this->assertDatabaseCount('product_variants', 2);
        $this->assertDatabaseMissing('product_variants', ['sku' => 'GL-LM-MD']);
        $this->assertDatabaseHas('product_variants', ['sku' => 'GL-LM-SM']);
        $this->assertDatabaseHas('product_variants', ['sku' => 'GL-LM-LG']);
    }

    public function test_product_without_variants_gets_default_variant(): void
    {
        $entry = $this->makeFakeEntry('mushroom-tincture', [
            'name' => 'Mushroom Tincture',
            'price' => 2499,
            'category' => 'tinctures',
            'in_stock' => true,
            'weight_grams' => 120,
            'images' => ['products/tincture-01.jpg'],
            'description' => 'A potent mushroom tincture.',
            'sizes_variants' => [],
        ]);

        $this->listener->handleSaved(new EntrySaved($entry));

        $this->assertDatabaseCount('product_variants', 1);
        $this->assertDatabaseHas('product_variants', [
            'name' => 'Default',
            'sku' => 'DEFAULT-MUSHROOM-TINCTURE',
            'price_pence' => 2499,
            'weight_grams' => 120,
            'in_stock' => true,
        ]);
    }

    public function test_non_product_entry_is_ignored(): void
    {
        $entry = $this->makeFakeEntry('about-us', [
            'title' => 'About Us',
        ], null, 'pages');

        $this->listener->handleSaved(new EntrySaved($entry));

        $this->assertDatabaseCount('products', 0);
    }

    /**
     * Create a mock Statamic entry without touching the Stache filesystem.
     */
    private function makeFakeEntry(
        string $slug,
        array $data,
        ?string $id = null,
        string $collection = 'products',
    ): object {
        $id ??= (string) Str::uuid();

        $entry = Mockery::mock(\Statamic\Contracts\Entries\Entry::class);

        $entry->shouldReceive('id')->andReturn($id);
        $entry->shouldReceive('slug')->andReturn($slug);
        $entry->shouldReceive('collectionHandle')->andReturn($collection);

        $entry->shouldReceive('get')->andReturnUsing(
            fn (string $key, mixed $default = null) => $data[$key] ?? $default,
        );

        // For Bard content - augmentedValue returns the string as-is when it's already a string
        $entry->shouldReceive('augmentedValue')->andReturnUsing(
            fn (string $key) => $data[$key] ?? null,
        );

        // Statamic multisite support - root() returns itself for single-site setups
        $entry->shouldReceive('root')->andReturn($entry);
        $entry->shouldReceive('ancestors')->andReturn(collect());

        return $entry;
    }
}
