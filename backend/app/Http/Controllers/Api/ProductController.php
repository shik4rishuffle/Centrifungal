<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Statamic\Facades\Asset;
use Statamic\Facades\Entry;

class ProductController extends Controller
{
    /**
     * List all published products with variants, optionally filtered by category.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Entry::query()
            ->where('collection', 'products')
            ->whereStatus('published')
            ->orderBy('title');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $products = $query->get()->map(fn ($entry) => $this->transformProduct($entry, summary: true));

        return response()->json([
            'data' => $products->values(),
        ])->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * Show a single product by slug with full description.
     */
    public function show(string $slug): JsonResponse
    {
        $entry = Entry::query()
            ->where('collection', 'products')
            ->whereStatus('published')
            ->where('slug', $slug)
            ->first();

        if (! $entry) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404)->header('Cache-Control', 'public, max-age=300');
        }

        return response()->json([
            'data' => $this->transformProduct($entry, summary: false),
        ])->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * List distinct categories with product counts.
     */
    public function categories(): JsonResponse
    {
        $products = Entry::query()
            ->where('collection', 'products')
            ->whereStatus('published')
            ->get();

        $categories = $products
            ->groupBy(fn ($entry) => $entry->get('category'))
            ->map(fn ($group, $category) => [
                'category' => $category,
                'product_count' => $group->count(),
            ])
            ->values();

        return response()->json([
            'data' => $categories,
        ])->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * Transform a Statamic entry into the product API shape.
     */
    private function transformProduct($entry, bool $summary = false): array
    {
        $basePrice = (int) ($entry->get('price') ?? 0);
        $inStock = (bool) ($entry->get('in_stock') ?? false);
        $variants = $this->transformVariants($entry, $basePrice, $inStock);

        $images = $this->resolveImages($entry->get('images') ?? []);

        $product = [
            'id' => $entry->id(),
            'name' => $entry->get('name') ?? $entry->get('title'),
            'slug' => $entry->slug(),
            'category' => $entry->get('category'),
            'base_price_pence' => $basePrice,
            'images' => $images,
            'variants' => $variants,
        ];

        if (! $summary) {
            $product['description'] = $this->transformDescription($entry->get('description'));
            $product['weight_grams'] = (int) ($entry->get('weight_grams') ?? 0);
            $product['meta_title'] = $entry->get('meta_title');
            $product['meta_description'] = $entry->get('meta_description');
        }

        return $product;
    }

    /**
     * Transform Statamic replicator variants into the API shape.
     * If no variants defined, create a single default variant from base product fields.
     */
    private function transformVariants($entry, int $basePrice, bool $masterInStock): array
    {
        $rawVariants = $entry->get('sizes_variants') ?? [];

        if (empty($rawVariants)) {
            return [[
                'id' => $entry->id() . '-default',
                'name' => 'Standard',
                'sku' => $entry->slug(),
                'price_pence' => $basePrice,
                'weight_grams' => (int) ($entry->get('weight_grams') ?? 0),
                'in_stock' => $masterInStock,
                'sort_order' => 0,
            ]];
        }

        return collect($rawVariants)
            ->filter(fn ($v) => ($v['enabled'] ?? true) && ($v['type'] ?? '') === 'variant')
            ->values()
            ->map(fn ($v, $i) => [
                'id' => $v['id'] ?? $entry->id() . '-' . $i,
                'name' => $v['variant_name'] ?? 'Variant',
                'sku' => $v['sku'] ?? $entry->slug() . '-' . $i,
                'price_pence' => (int) ($v['price_override'] ?? $basePrice),
                'weight_grams' => (int) ($entry->get('weight_grams') ?? 0),
                'in_stock' => $masterInStock && ($v['in_stock'] ?? true),
                'sort_order' => $i,
            ])
            ->all();
    }

    /**
     * Resolve asset references to full URLs.
     */
    private function resolveImages(array $images): array
    {
        return collect($images)
            ->map(function ($ref) {
                if (is_string($ref)) {
                    $asset = Asset::findByPath($ref)
                        ?? Asset::findById("images::{$ref}");

                    if ($asset) {
                        return [
                            'url' => $asset->absoluteUrl(),
                            'alt' => $asset->get('alt') ?? '',
                        ];
                    }
                }

                return null;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Transform Bard description field to plain HTML string.
     */
    private function transformDescription(mixed $description): string
    {
        if (is_string($description)) {
            return $description;
        }

        if (! is_array($description)) {
            return '';
        }

        return collect($description)
            ->map(fn ($node) => $this->bardNodeToHtml($node))
            ->implode('');
    }

    /**
     * Convert a Bard/ProseMirror node to HTML.
     */
    private function bardNodeToHtml(array $node): string
    {
        $type = $node['type'] ?? '';
        $content = $node['content'] ?? [];

        if ($type === 'set') {
            $values = $node['attrs']['values'] ?? [];
            $body = $values['body'] ?? [];

            return collect($body)
                ->map(fn ($n) => $this->bardNodeToHtml($n))
                ->implode('');
        }

        $inner = collect($content)
            ->map(fn ($child) => $this->bardNodeToHtml($child))
            ->implode('');

        return match ($type) {
            'paragraph' => "<p>{$inner}</p>",
            'heading' => '<h' . ($node['attrs']['level'] ?? 2) . '>' . $inner . '</h' . ($node['attrs']['level'] ?? 2) . '>',
            'bulletList', 'bullet_list' => "<ul>{$inner}</ul>",
            'orderedList', 'ordered_list' => "<ol>{$inner}</ol>",
            'listItem', 'list_item' => "<li>{$inner}</li>",
            'text' => $this->renderTextMarks($node),
            default => $inner,
        };
    }

    /**
     * Render text node with marks (bold, italic, link).
     */
    private function renderTextMarks(array $node): string
    {
        $text = e($node['text'] ?? '');
        $marks = $node['marks'] ?? [];

        foreach ($marks as $mark) {
            $text = match ($mark['type'] ?? '') {
                'bold' => "<strong>{$text}</strong>",
                'italic' => "<em>{$text}</em>",
                'link' => '<a href="' . e($mark['attrs']['href'] ?? '#') . '">' . $text . '</a>',
                default => $text,
            };
        }

        return $text;
    }
}
