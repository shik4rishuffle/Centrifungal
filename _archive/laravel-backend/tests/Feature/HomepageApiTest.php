<?php

namespace Tests\Feature;

use Tests\TestCase;

class HomepageApiTest extends TestCase
{
    public function test_homepage_endpoint_returns_200_with_correct_structure(): void
    {
        $response = $this->getJson('/api/homepage');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'hero' => [
                    'eyebrow',
                    'title',
                    'text',
                    'cta_primary' => ['text', 'link'],
                    'cta_secondary' => ['text', 'link'],
                ],
                'featured' => ['heading', 'subtitle'],
                'story' => [
                    'heading',
                    'text',
                    'cta' => ['text', 'link'],
                    'image',
                ],
                'usps' => [
                    'heading',
                    'subtitle',
                    'cards',
                ],
                'cta' => [
                    'heading',
                    'text',
                    'button' => ['text', 'link'],
                ],
                'meta' => ['title', 'description'],
            ],
        ]);
    }

    public function test_hero_section_has_required_fields(): void
    {
        $response = $this->getJson('/api/homepage');

        $response->assertOk();

        $hero = $response->json('data.hero');
        $this->assertNotNull($hero['eyebrow']);
        $this->assertNotNull($hero['title']);
        $this->assertNotNull($hero['text']);
        $this->assertNotNull($hero['cta_primary']['text']);
        $this->assertNotNull($hero['cta_primary']['link']);
    }

    public function test_usp_cards_are_returned_as_array(): void
    {
        $response = $this->getJson('/api/homepage');

        $response->assertOk();

        $cards = $response->json('data.usps.cards');
        $this->assertIsArray($cards);
        $this->assertNotEmpty($cards);

        $firstCard = $cards[0];
        $this->assertArrayHasKey('icon', $firstCard);
        $this->assertArrayHasKey('title', $firstCard);
        $this->assertArrayHasKey('text', $firstCard);
    }

    public function test_story_image_is_a_full_url(): void
    {
        $response = $this->getJson('/api/homepage');

        $response->assertOk();

        $image = $response->json('data.story.image');
        $this->assertNotNull($image);
        $this->assertMatchesRegularExpression('#^https?://#', $image);
    }

    public function test_homepage_returns_cache_control_header(): void
    {
        $response = $this->getJson('/api/homepage');

        $response->assertOk();
        $response->assertHeader('Cache-Control', 'max-age=300, public');
    }
}
