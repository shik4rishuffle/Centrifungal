<?php

namespace App\Listeners;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\ProseMirrorRenderer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Statamic\Events\EntryDeleted;
use Statamic\Events\EntrySaved;
use Statamic\Facades\Asset;

class SyncProductToDatabase
{
    /**
     * Handle an EntrySaved event.
     */
    public function handleSaved(EntrySaved $event): void
    {
        $entry = $event->entry;

        if ($entry->collectionHandle() !== 'products') {
            return;
        }

        DB::transaction(function () use ($entry) {
            $product = $this->syncProduct($entry);
            $this->syncVariants($product, $entry);
        });

        Log::info('Product synced to database.', [
            'statamic_id' => $entry->id(),
            'slug' => $entry->slug(),
        ]);
    }

    /**
     * Handle an EntryDeleted event.
     */
    public function handleDeleted(EntryDeleted $event): void
    {
        $entry = $event->entry;

        if ($entry->collectionHandle() !== 'products') {
            return;
        }

        $product = Product::where('statamic_id', $entry->id())->first();

        if (! $product) {
            return;
        }

        $product->variants()->delete();
        $product->update(['is_active' => false]);

        Log::info('Product deactivated in database.', [
            'statamic_id' => $entry->id(),
            'slug' => $entry->slug(),
        ]);
    }

    /**
     * Sync the product entry to the products table.
     */
    private function syncProduct(mixed $entry): Product
    {
        return Product::updateOrCreate(
            ['statamic_id' => $entry->id()],
            [
                'name' => $entry->get('name'),
                'slug' => $entry->slug(),
                'description' => $this->convertBardToHtml($entry, 'description'),
                'category' => $entry->get('category'),
                'base_price_pence' => (int) $entry->get('price'),
                'is_active' => (bool) $entry->get('in_stock', true),
                'images' => $this->resolveImageUrls($entry->get('images') ?? []),
            ],
        );
    }

    /**
     * Sync variants from the replicator field to the product_variants table.
     */
    private function syncVariants(Product $product, mixed $entry): void
    {
        $variants = $entry->get('sizes_variants') ?? [];
        $weightGrams = (int) $entry->get('weight_grams', 0);
        $basePrice = (int) $entry->get('price');

        if (empty($variants)) {
            $this->createDefaultVariant($product, $basePrice, $weightGrams);

            return;
        }

        $syncedSkus = [];

        foreach ($variants as $index => $variant) {
            if (($variant['type'] ?? null) !== 'variant') {
                continue;
            }

            $sku = $variant['sku'] ?? null;

            if (! $sku) {
                continue;
            }

            ProductVariant::updateOrCreate(
                ['sku' => $sku],
                [
                    'product_id' => $product->id,
                    'name' => $variant['variant_name'] ?? 'Unnamed',
                    'price_pence' => (int) ($variant['price_override'] ?? $basePrice),
                    'weight_grams' => $weightGrams,
                    'in_stock' => (bool) ($variant['in_stock'] ?? true),
                    'sort_order' => $index,
                ],
            );

            $syncedSkus[] = $sku;
        }

        // Remove orphaned variants that are no longer in the CMS entry
        $product->variants()
            ->whereNotIn('sku', $syncedSkus)
            ->delete();
    }

    /**
     * Create a single default variant when the product has no explicit variants.
     */
    private function createDefaultVariant(Product $product, int $basePrice, int $weightGrams): void
    {
        $defaultSku = 'DEFAULT-' . Str::upper(Str::slug($product->slug, '-'));

        ProductVariant::updateOrCreate(
            ['sku' => $defaultSku],
            [
                'product_id' => $product->id,
                'name' => 'Default',
                'price_pence' => $basePrice,
                'weight_grams' => $weightGrams,
                'in_stock' => $product->is_active,
                'sort_order' => 0,
            ],
        );

        // Clean up any non-default variants that might be left over
        $product->variants()
            ->where('sku', '!=', $defaultSku)
            ->delete();
    }

    /**
     * Resolve asset filenames to absolute URLs.
     */
    private function resolveImageUrls(array $filenames): array
    {
        return collect($filenames)
            ->map(function (string $filename): ?array {
                $asset = Asset::findByPath($filename)
                    ?? Asset::findById("images::{$filename}");

                if (! $asset) {
                    return null;
                }

                return [
                    'url' => $asset->absoluteUrl(),
                    'alt' => $asset->get('alt') ?? '',
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Convert a Bard field's ProseMirror content to an HTML string.
     */
    private function convertBardToHtml(mixed $entry, string $fieldHandle): string
    {
        $value = $entry->get($fieldHandle);

        if (is_string($value)) {
            return $value;
        }

        if (empty($value) || ! is_array($value)) {
            return '';
        }

        return ProseMirrorRenderer::render($value);
    }
}
