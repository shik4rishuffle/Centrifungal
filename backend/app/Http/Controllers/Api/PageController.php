<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Statamic\Facades\Asset;
use Statamic\Facades\Entry;

class PageController extends Controller
{
    /**
     * List all published pages with summary fields (no full content).
     */
    public function index(): JsonResponse
    {
        $pages = Entry::query()
            ->where('collection', 'pages')
            ->whereStatus('published')
            ->orderBy('title')
            ->get()
            ->map(fn ($entry) => [
                'slug' => $entry->slug(),
                'title' => $entry->get('title'),
                'subtitle' => $entry->get('subtitle'),
                'meta_title' => $entry->get('meta_title'),
                'meta_description' => $entry->get('meta_description'),
            ])
            ->values();

        return response()->json([
            'data' => $pages,
        ])->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * Show a single page by slug with full content blocks.
     */
    public function show(string $slug): JsonResponse
    {
        $entry = Entry::query()
            ->where('collection', 'pages')
            ->whereStatus('published')
            ->where('slug', $slug)
            ->first();

        if (! $entry) {
            return response()->json([
                'message' => 'Page not found.',
            ], 404)->header('Cache-Control', 'public, max-age=300');
        }

        $pageContent = $entry->get('page_content') ?? [];

        $blocks = collect($pageContent)
            ->filter(fn ($item) => ($item['type'] ?? null) === 'set')
            ->map(fn ($item) => $this->transformBlock($item['attrs']['values'] ?? []))
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'slug' => $entry->slug(),
                'title' => $entry->get('title'),
                'subtitle' => $entry->get('subtitle'),
                'meta_title' => $entry->get('meta_title'),
                'meta_description' => $entry->get('meta_description'),
                'page_content' => $blocks,
            ],
        ])->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * Transform a Bard block set into a structured JSON block.
     */
    private function transformBlock(array $values): array
    {
        $type = $values['type'] ?? 'unknown';

        $block = ['type' => $type];

        foreach ($values as $key => $value) {
            if ($key !== 'type') {
                $block[$key] = $this->resolveValue($value);
            }
        }

        return $block;
    }

    /**
     * Resolve asset references to full URLs recursively.
     */
    private function resolveValue(mixed $value): mixed
    {
        if (is_string($value)) {
            return $this->resolveAssetUrl($value);
        }

        if (is_array($value)) {
            // Array of asset references (e.g. gallery images)
            if (array_is_list($value) && ! empty($value) && is_string($value[0])) {
                $resolved = array_map(fn ($v) => $this->resolveAssetUrl($v), $value);
                if ($resolved !== $value) {
                    return $resolved;
                }
            }

            return $value;
        }

        return $value;
    }

    /**
     * Return the homepage entry's structured fields grouped by section.
     */
    public function homepage(): JsonResponse
    {
        $entry = Entry::query()
            ->where('collection', 'pages')
            ->whereStatus('published')
            ->where('slug', 'homepage')
            ->first();

        if (! $entry) {
            return response()->json([
                'message' => 'Homepage not found.',
            ], 404)->header('Cache-Control', 'public, max-age=300');
        }

        $uspCards = collect($entry->get('usp_cards') ?? [])
            ->map(fn (array $set) => [
                'icon' => $set['icon'] ?? '',
                'title' => $set['card_title'] ?? $set['title'] ?? '',
                'text' => $set['card_text'] ?? $set['text'] ?? '',
            ])
            ->values()
            ->all();

        $heroImage = $entry->get('hero_image');
        if ($heroImage) {
            $heroImage = $this->resolveAssetUrl($heroImage);
        }

        $storyImage = $entry->get('story_image');
        if ($storyImage) {
            $storyImage = $this->resolveAssetUrl($storyImage);
        }

        return response()->json([
            'data' => [
                'hero' => [
                    'eyebrow' => $entry->get('hero_eyebrow'),
                    'title' => $entry->get('hero_title'),
                    'text' => $entry->get('hero_text'),
                    'image' => $heroImage,
                    'cta_primary' => [
                        'text' => $entry->get('hero_cta_primary_text'),
                        'link' => $entry->get('hero_cta_primary_link'),
                    ],
                    'cta_secondary' => [
                        'text' => $entry->get('hero_cta_secondary_text'),
                        'link' => $entry->get('hero_cta_secondary_link'),
                    ],
                ],
                'featured' => [
                    'heading' => $entry->get('featured_heading'),
                    'subtitle' => $entry->get('featured_subtitle'),
                ],
                'story' => [
                    'heading' => $entry->get('story_heading'),
                    'text' => $entry->get('story_text'),
                    'cta' => [
                        'text' => $entry->get('story_cta_text'),
                        'link' => $entry->get('story_cta_link'),
                    ],
                    'image' => $storyImage,
                ],
                'usps' => [
                    'heading' => $entry->get('usp_heading'),
                    'subtitle' => $entry->get('usp_subtitle'),
                    'cards' => $uspCards,
                ],
                'cta' => [
                    'heading' => $entry->get('cta_heading'),
                    'text' => $entry->get('cta_text'),
                    'button' => [
                        'text' => $entry->get('cta_button_text'),
                        'link' => $entry->get('cta_button_link'),
                    ],
                ],
                'meta' => [
                    'title' => $entry->get('meta_title'),
                    'description' => $entry->get('meta_description'),
                ],
            ],
        ])->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * If a string looks like an asset reference, resolve it to a full URL.
     */
    private function resolveAssetUrl(string $value): string
    {
        // Statamic stores asset references as container::path or just the filename
        $asset = Asset::findByPath($value)
            ?? Asset::findById("images::{$value}");

        if ($asset) {
            return $asset->absoluteUrl();
        }

        return $value;
    }
}
