<?php

namespace App\Services;

use Statamic\Fields\Value;

/**
 * Helpers for unwrapping Statamic Value objects in live preview templates.
 *
 * In live preview, field values arrive as Value objects rather than plain
 * scalars. These methods safely extract the underlying data.
 */
class StatamicValueHelper
{
    /**
     * Unwrap a Value object to its raw value, returning a fallback if null.
     */
    public static function unwrap(mixed $val, mixed $fallback = null): mixed
    {
        if ($val === null) {
            return $fallback;
        }

        if ($val instanceof Value) {
            return $val->value() ?? $fallback;
        }

        return $val;
    }

    /**
     * Unwrap a Value object, ensuring the result is a string.
     */
    public static function unwrapString(mixed $val, string $fallback = ''): string
    {
        $v = self::unwrap($val, $fallback);

        return is_string($v) ? $v : $fallback;
    }

    /**
     * Unwrap an image field to an array of URL strings.
     *
     * Handles plain strings, asset objects with ->url(), and Value wrappers.
     */
    public static function unwrapImages(mixed $raw): array
    {
        $raw = self::unwrap($raw);

        if (! is_iterable($raw)) {
            return [];
        }

        $urls = [];
        foreach ($raw as $item) {
            if (is_string($item)) {
                $urls[] = $item;
            } elseif (is_object($item) && method_exists($item, 'url')) {
                $urls[] = $item->url();
            }
        }

        return $urls;
    }

    /**
     * Resolve a single image field to a URL string or null.
     *
     * Handles strings, Asset objects, Value wrappers, arrays, and Collections.
     */
    public static function resolveImageUrl(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        if (is_string($raw)) {
            return $raw;
        }

        if (is_object($raw) && method_exists($raw, 'url')) {
            return $raw->url();
        }

        if ($raw instanceof Value) {
            $resolved = $raw->value();

            if (is_string($resolved)) {
                return $resolved;
            }

            if (is_object($resolved) && method_exists($resolved, 'url')) {
                return $resolved->url();
            }

            // Value wrapping a collection/array of assets - take the first
            $raw = $resolved;
        }

        if (is_array($raw) || $raw instanceof \Illuminate\Support\Collection) {
            $first = collect($raw)->first();

            if (is_object($first) && method_exists($first, 'url')) {
                return $first->url();
            }

            if (is_string($first)) {
                return $first;
            }
        }

        return null;
    }

    /**
     * Convert a Bard field value (Value object, ProseMirror array, or string) to HTML.
     */
    public static function bardToHtml(mixed $val): string
    {
        if ($val === null) {
            return '';
        }

        if (is_string($val)) {
            return $val;
        }

        if ($val instanceof Value) {
            $val = $val->value();
        }

        if (is_string($val)) {
            return $val;
        }

        if (! is_array($val)) {
            return '';
        }

        return ProseMirrorRenderer::render($val);
    }
}
