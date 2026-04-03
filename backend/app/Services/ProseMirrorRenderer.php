<?php

namespace App\Services;

/**
 * Converts ProseMirror JSON (from Statamic Bard fields) to HTML.
 *
 * Used by both live preview Blade templates and the product sync listener
 * to avoid duplicating the rendering logic.
 */
class ProseMirrorRenderer
{
    /**
     * Render an array of ProseMirror nodes to an HTML string.
     * Accepts plain arrays or Statamic Values/ArrayAccess objects.
     */
    public static function render(mixed $nodes): string
    {
        if (! is_iterable($nodes)) {
            return '';
        }

        $html = '';
        foreach ($nodes as $node) {
            $html .= self::renderNode(self::toArray($node));
        }

        return $html;
    }

    /**
     * Convert a node to a plain array, handling Statamic Values objects.
     */
    private static function toArray(mixed $node): array
    {
        if (is_array($node)) {
            return $node;
        }

        if ($node instanceof \ArrayAccess || $node instanceof \Traversable) {
            return json_decode(json_encode($node), true) ?? [];
        }

        return [];
    }

    private static function renderNode(array $node): string
    {
        $type = $node['type'] ?? '';
        $content = isset($node['content']) && is_iterable($node['content'])
            ? self::render($node['content'])
            : '';

        // Bard set blocks (text_block, etc.)
        if ($type === 'set' && isset($node['attrs']['values'])) {
            $values = self::toArray($node['attrs']['values']);
            if (isset($values['body']) && is_iterable($values['body'])) {
                return self::render($values['body']);
            }

            return '';
        }

        return match ($type) {
            'paragraph' => "<p>{$content}</p>",
            'heading' => sprintf('<h%1$d>%2$s</h%1$d>', $node['attrs']['level'] ?? 2, $content),
            'text' => self::renderText($node),
            'bullet_list', 'bulletList' => "<ul>{$content}</ul>",
            'ordered_list', 'orderedList' => "<ol>{$content}</ol>",
            'list_item', 'listItem' => "<li>{$content}</li>",
            'blockquote' => "<blockquote>{$content}</blockquote>",
            'hard_break', 'hardBreak' => '<br>',
            'horizontal_rule', 'horizontalRule' => '<hr>',
            default => $content,
        };
    }

    private static function renderText(array $node): string
    {
        $text = e($node['text'] ?? '');

        foreach ($node['marks'] ?? [] as $mark) {
            $mark = self::toArray($mark);
            $text = match ($mark['type'] ?? '') {
                'bold' => "<strong>{$text}</strong>",
                'italic' => "<em>{$text}</em>",
                'code' => "<code>{$text}</code>",
                'link' => sprintf('<a href="%s">%s</a>', e($mark['attrs']['href'] ?? '#'), $text),
                default => $text,
            };
        }

        return $text;
    }
}
