<?php

namespace Tests\Unit;

use App\DTOs\RoyalMailResponse;
use App\Models\Order;
use App\Services\RoyalMailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class RoyalMailServiceTest extends TestCase
{
    use RefreshDatabase;

    private RoyalMailService $service;
    private string $apiUrl = 'https://api.test.royalmail.com';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.royal_mail.api_url' => $this->apiUrl,
            'services.royal_mail.api_key' => 'test-api-key',
            'services.royal_mail.api_secret' => 'test-api-secret',
        ]);

        $this->service = new RoyalMailService();
    }

    public function test_push_order_sends_correct_request_body_structure(): void
    {
        Http::fake([
            "{$this->apiUrl}/api/0/orders" => Http::response([
                'orderIdentifiers' => [
                    ['orderReference' => 'RM-123456'],
                ],
            ], 200),
        ]);

        $order = Order::factory()->create([
            'order_number' => 'CF-000001',
            'customer_name' => 'Alice Testerton',
            'shipping_address' => [
                'line1' => '10 Downing Street',
                'line2' => '',
                'city' => 'London',
                'county' => 'Greater London',
                'postcode' => 'SW1A 2AA',
            ],
            'items_snapshot' => [
                [
                    'name' => 'Shiitake Grow Log - Medium',
                    'description' => 'Shiitake mushroom grow log',
                    'quantity' => 2,
                    'price_pence' => 1500,
                    'weight_grams' => 800,
                ],
            ],
            'subtotal_pence' => 3000,
            'shipping_pence' => 395,
            'total_pence' => 3395,
        ]);

        $this->service->pushOrder($order);

        Http::assertSent(function (Request $request) {
            $body = $request->data();

            // Top-level 'items' array with one order item
            $this->assertArrayHasKey('items', $body);
            $this->assertCount(1, $body['items']);

            $item = $body['items'][0];

            // Recipient structure
            $recipient = $item['recipient'];
            $this->assertSame('Alice Testerton', $recipient['name']);
            $this->assertSame('10 Downing Street', $recipient['addressLine1']);
            $this->assertSame('', $recipient['addressLine2']);
            $this->assertSame('London', $recipient['city']);
            $this->assertSame('Greater London', $recipient['county']);
            $this->assertSame('SW1A 2AA', $recipient['postcode']);
            $this->assertSame('GB', $recipient['countryCode']);

            // Order reference
            $this->assertSame('CF-000001', $item['orderReference']);

            // Money fields converted from pence to pounds
            $this->assertEqualsWithDelta(30.0, $item['subtotal'], 0.001);
            $this->assertEqualsWithDelta(3.95, $item['shippingCostPaid'], 0.001);
            $this->assertEqualsWithDelta(33.95, $item['total'], 0.001);

            // Weight is total weight (weight_grams * quantity)
            $this->assertSame(1600, $item['weight']);

            // Nested items array
            $this->assertCount(1, $item['items']);
            $lineItem = $item['items'][0];
            $this->assertSame('Shiitake Grow Log - Medium', $lineItem['description']);
            $this->assertSame(2, $lineItem['quantity']);
            $this->assertSame(800, $lineItem['weight']);
            $this->assertEqualsWithDelta(15.0, $lineItem['value'], 0.001);

            // Bearer token
            $this->assertTrue($request->hasHeader('Authorization', 'Bearer test-api-key'));

            return true;
        });
    }

    public function test_successful_push_returns_order_id(): void
    {
        Http::fake([
            "{$this->apiUrl}/api/0/orders" => Http::response([
                'orderIdentifiers' => [
                    ['orderReference' => 'RM-789012'],
                ],
            ], 200),
        ]);

        $order = Order::factory()->create();

        $result = $this->service->pushOrder($order);

        $this->assertInstanceOf(RoyalMailResponse::class, $result);
        $this->assertTrue($result->success);
        $this->assertSame('RM-789012', $result->orderId);
        $this->assertNull($result->error);
    }

    public function test_5xx_response_triggers_retry(): void
    {
        Http::fake([
            "{$this->apiUrl}/api/0/orders" => Http::sequence()
                ->push(['error' => 'Internal Server Error'], 500)
                ->push(['error' => 'Internal Server Error'], 500)
                ->push([
                    'orderIdentifiers' => [
                        ['orderReference' => 'RM-RETRY-OK'],
                    ],
                ], 200),
        ]);

        $order = Order::factory()->create();

        $result = $this->service->pushOrder($order);

        $this->assertTrue($result->success);
        $this->assertSame('RM-RETRY-OK', $result->orderId);

        // Verify 3 requests were made (2 failures + 1 success)
        Http::assertSentCount(3);
    }

    public function test_4xx_response_does_not_retry_and_logs_error(): void
    {
        Http::fake([
            "{$this->apiUrl}/api/0/orders" => Http::response([
                'message' => 'Invalid order data',
            ], 400),
        ]);

        Log::spy();

        $order = Order::factory()->create();

        $result = $this->service->pushOrder($order);

        // Should not retry - only 1 request
        Http::assertSentCount(1);

        // Should return a failed response
        $this->assertFalse($result->success);
        $this->assertSame('Invalid order data', $result->error);

        // Should log an error-level response (status >= 400 triggers 'error' level)
        Log::shouldHaveReceived('error')
            ->withArgs(function (string $message, array $context) use ($order) {
                return str_contains($message, 'RoyalMail pushOrder response')
                    && $context['status'] === 400;
            })
            ->once();
    }

    public function test_pii_is_not_written_to_logs_in_full(): void
    {
        Http::fake([
            "{$this->apiUrl}/api/0/orders" => Http::response([
                'orderIdentifiers' => [
                    ['orderReference' => 'RM-PII-TEST'],
                ],
            ], 200),
        ]);

        Log::spy();

        $order = Order::factory()->create([
            'customer_name' => 'Sensitive McPersonface',
            'shipping_address' => [
                'line1' => '42 Secret Lane',
                'line2' => 'Flat 7B',
                'city' => 'Privatown',
                'county' => 'Hiddenshire',
                'postcode' => 'AB1 2CD',
            ],
        ]);

        $this->service->pushOrder($order);

        // Verify the request log entry has sanitised PII
        Log::shouldHaveReceived('info')
            ->withArgs(function (string $message, array $context) {
                if (!str_contains($message, 'RoyalMail pushOrder request')) {
                    return false;
                }

                $payload = $context['payload'] ?? [];
                $recipient = $payload['items'][0]['recipient'] ?? [];

                // Name and address lines must be redacted
                if ($recipient['name'] !== '[REDACTED]') {
                    return false;
                }
                if ($recipient['addressLine1'] !== '[REDACTED]') {
                    return false;
                }
                if ($recipient['addressLine2'] !== '[REDACTED]') {
                    return false;
                }
                if ($recipient['city'] !== '[REDACTED]') {
                    return false;
                }
                if ($recipient['county'] !== '[REDACTED]') {
                    return false;
                }

                // Postcode should only have the prefix, not the full postcode
                if (str_contains($recipient['postcode'], '2CD')) {
                    return false;
                }
                // Should contain prefix with masked suffix
                if ($recipient['postcode'] !== 'AB1 ***') {
                    return false;
                }

                return true;
            })
            ->once();

        // Also verify the full address never appears in any log call
        Log::shouldNotHaveReceived('info', function (string $message, array $context) {
            $serialised = json_encode($context);

            return str_contains($serialised, '42 Secret Lane')
                || str_contains($serialised, 'Sensitive McPersonface')
                || str_contains($serialised, 'Flat 7B');
        });
    }
}
