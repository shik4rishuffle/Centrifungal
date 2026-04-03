<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CpLoginTest extends TestCase
{
    use RefreshDatabase;
    public function test_cp_login_page_loads_successfully(): void
    {
        $response = $this->get('/cp/auth/login');

        $response->assertOk();
    }

    public function test_cp_login_page_contains_statamic_inertia_props(): void
    {
        $response = $this->get('/cp/auth/login');

        $response->assertOk();

        $content = $response->getContent();

        $this->assertStringContains('_statamic', $content, 'CP login page is missing _statamic Inertia props - check that the statamic.cp middleware group includes HandleInertiaRequests');
    }

    public function test_cp_login_page_contains_logos_prop(): void
    {
        $response = $this->get('/cp/auth/login');

        $props = $this->extractInertiaProps($response->getContent());

        $this->assertArrayHasKey('_statamic', $props, 'Missing _statamic in Inertia props');
        $this->assertArrayHasKey('logos', $props['_statamic'], 'Missing logos in _statamic props');
        $this->assertArrayHasKey('text', $props['_statamic']['logos'], 'Missing logos.text');
        $this->assertArrayHasKey('light', $props['_statamic']['logos'], 'Missing logos.light');
        $this->assertArrayHasKey('dark', $props['_statamic']['logos'], 'Missing logos.dark');
    }

    public function test_users_table_has_all_statamic_required_columns(): void
    {
        $required = ['super', 'preferences', 'avatar', 'last_login'];

        foreach ($required as $column) {
            $this->assertTrue(
                Schema::hasColumn('users', $column),
                "Users table is missing the '{$column}' column required by Statamic's eloquent user driver"
            );
        }
    }

    public function test_statamic_auth_tables_exist(): void
    {
        $tables = ['role_user', 'group_user'];

        foreach ($tables as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Missing '{$table}' table required by Statamic's eloquent user driver"
            );
        }
    }

    public function test_cp_login_sets_last_login_timestamp(): void
    {
        $user = User::factory()->create([
            'super' => true,
            'password' => bcrypt('password'),
        ]);

        $this->assertNull($user->last_login);

        $this->post('/cp/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $user->refresh();

        $this->assertNotNull($user->last_login, 'last_login was not set after successful login');
    }

    public function test_collection_survives_cache_round_trip(): void
    {
        $original = collect(['http://localhost/cp', 'http://localhost/cp/collections']);

        cache()->put('test-collection-round-trip', $original, 60);
        $restored = cache()->get('test-collection-round-trip');

        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $restored, 'Cache store cannot round-trip Collection objects - database cache is incompatible with PHP 8.5, use file cache instead');
        $this->assertEquals($original->all(), $restored->all());
    }

    public function test_cp_dashboard_loads_after_login(): void
    {
        $user = User::factory()->create([
            'super' => true,
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user);

        $response = $this->get('/cp');

        // /cp redirects to the dashboard start page
        $response->assertRedirect();

        $dashboard = $this->get($response->headers->get('Location'));
        $dashboard->assertOk();
    }

    public function test_cp_login_redirects_authenticated_user(): void
    {
        $user = User::factory()->create([
            'super' => true,
            'password' => bcrypt('password'),
        ]);

        $response = $this->post('/cp/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect();
    }

    private function assertStringContains(string $needle, string $haystack, string $message = ''): void
    {
        $this->assertTrue(str_contains($haystack, $needle), $message);
    }

    private function extractInertiaProps(string $html): array
    {
        preg_match('/data-page="([^"]*)"/', $html, $matches);

        $this->assertNotEmpty($matches[1] ?? '', 'Could not find Inertia data-page attribute');

        $decoded = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
        $data = json_decode($decoded, true);

        $this->assertNotNull($data, 'Failed to parse Inertia page data as JSON');

        return $data['props'] ?? [];
    }
}
