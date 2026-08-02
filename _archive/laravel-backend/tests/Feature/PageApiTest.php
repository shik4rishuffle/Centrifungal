<?php

namespace Tests\Feature;

use Tests\TestCase;

class PageApiTest extends TestCase
{
    public function test_list_pages_returns_all_published_pages(): void
    {
        $response = $this->getJson('/api/pages');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'slug',
                    'title',
                    'subtitle',
                    'meta_title',
                    'meta_description',
                ],
            ],
        ]);

        // The content directory has 4 pages
        $response->assertJsonCount(4, 'data');

        $slugs = collect($response->json('data'))->pluck('slug')->sort()->values()->all();
        $this->assertSame(['about', 'care-instructions', 'contact', 'faq'], $slugs);
    }

    public function test_list_pages_does_not_include_page_content(): void
    {
        $response = $this->getJson('/api/pages');

        $response->assertOk();
        $response->assertJsonMissingPath('data.0.page_content');
    }

    public function test_list_pages_returns_cache_control_header(): void
    {
        $response = $this->getJson('/api/pages');

        $response->assertOk();
        $response->assertHeader('Cache-Control', 'max-age=300, public');
    }

    public function test_show_page_returns_full_page_by_slug(): void
    {
        $response = $this->getJson('/api/pages/about');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'slug',
                'title',
                'subtitle',
                'meta_title',
                'meta_description',
                'page_content' => [
                    '*' => [
                        'type',
                    ],
                ],
            ],
        ]);

        $response->assertJsonPath('data.slug', 'about');
        $response->assertJsonPath('data.title', 'About');
        $response->assertJsonPath('data.meta_title', 'About Centrifungal - UK Mushroom Grow Logs');
    }

    public function test_show_page_returns_structured_bard_content_blocks(): void
    {
        $response = $this->getJson('/api/pages/about');

        $response->assertOk();

        $blocks = $response->json('data.page_content');
        $this->assertNotEmpty($blocks);

        // The about page has a text_block
        $firstBlock = $blocks[0];
        $this->assertSame('text_block', $firstBlock['type']);
        $this->assertArrayHasKey('body', $firstBlock);
    }

    public function test_show_page_returns_faq_group_blocks(): void
    {
        $response = $this->getJson('/api/pages/faq');

        $response->assertOk();

        $blocks = $response->json('data.page_content');
        $this->assertNotEmpty($blocks);

        $faqBlock = $blocks[0];
        $this->assertSame('faq_group', $faqBlock['type']);
        $this->assertArrayHasKey('items', $faqBlock);
        $this->assertNotEmpty($faqBlock['items']);

        // Each FAQ item should have question and answer
        $firstItem = $faqBlock['items'][0];
        $this->assertArrayHasKey('question', $firstItem);
        $this->assertArrayHasKey('answer', $firstItem);
    }

    public function test_show_page_returns_cache_control_header(): void
    {
        $response = $this->getJson('/api/pages/about');

        $response->assertOk();
        $response->assertHeader('Cache-Control', 'max-age=300, public');
    }

    public function test_nonexistent_slug_returns_404(): void
    {
        $response = $this->getJson('/api/pages/nonexistent');

        $response->assertNotFound();
        $response->assertJson([
            'message' => 'Page not found.',
        ]);
    }

    public function test_show_page_returns_404_with_cache_control_header(): void
    {
        $response = $this->getJson('/api/pages/nonexistent');

        $response->assertNotFound();
        $response->assertHeader('Cache-Control', 'max-age=300, public');
    }
}
