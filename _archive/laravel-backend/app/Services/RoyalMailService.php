<?php

namespace App\Services;

use App\DTOs\RoyalMailResponse;
use App\DTOs\TrackingInfo;
use App\Models\Order;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RoyalMailService
{
    private string $apiUrl;
    private string $apiKey;
    private string $apiSecret;

    /** @var int[] Backoff delays in milliseconds */
    private const RETRY_DELAYS = [1000, 2000, 4000];

    public function __construct()
    {
        $this->apiUrl = config('services.royal_mail.api_url');
        $this->apiKey = config('services.royal_mail.api_key');
        $this->apiSecret = config('services.royal_mail.api_secret');
    }

    public function pushOrder(Order $order): RoyalMailResponse
    {
        $payload = $this->buildOrderPayload($order);

        $this->logRequest('pushOrder', $order->order_number, $this->sanitisePayload($payload));

        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->retry(
                    times: count(self::RETRY_DELAYS) + 1,
                    sleepMilliseconds: fn (int $attempt) => self::RETRY_DELAYS[$attempt - 2] ?? 0,
                    when: fn ($exception) => $this->isRetryable($exception),
                    throw: false,
                )
                ->post("{$this->apiUrl}/api/0/orders", $payload);

            $body = $response->json();

            $this->logResponse('pushOrder', $order->order_number, $response->status(), $this->sanitiseResponseBody($body));

            if ($response->successful() && !empty($body['orderIdentifiers'][0]['orderReference'])) {
                return RoyalMailResponse::succeeded($body['orderIdentifiers'][0]['orderReference']);
            }

            $error = $body['message'] ?? $body['error'] ?? "HTTP {$response->status()}";

            return RoyalMailResponse::failed($error);
        } catch (ConnectionException $e) {
            Log::error('RoyalMail pushOrder connection failed', [
                'order_number' => $order->order_number,
                'exception' => $e->getMessage(),
            ]);

            return RoyalMailResponse::failed('Connection to Royal Mail API failed: ' . $e->getMessage());
        }
    }

    public function getOrderStatus(string $royalMailOrderId): TrackingInfo
    {
        $this->logRequest('getOrderStatus', $royalMailOrderId);

        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->retry(
                    times: count(self::RETRY_DELAYS) + 1,
                    sleepMilliseconds: fn (int $attempt) => self::RETRY_DELAYS[$attempt - 2] ?? 0,
                    when: fn ($exception) => $this->isRetryable($exception),
                    throw: false,
                )
                ->get("{$this->apiUrl}/api/0/orders/{$royalMailOrderId}");

            $body = $response->json();

            $this->logResponse('getOrderStatus', $royalMailOrderId, $response->status(), $body);

            if (!$response->successful()) {
                return new TrackingInfo(status: 'error');
            }

            return new TrackingInfo(
                trackingNumber: $body['trackingNumber'] ?? null,
                trackingUrl: !empty($body['trackingNumber'])
                    ? "https://www.royalmail.com/track-your-item#/tracking-results/{$body['trackingNumber']}"
                    : null,
                status: $body['status'] ?? 'unknown',
            );
        } catch (ConnectionException $e) {
            Log::error('RoyalMail getOrderStatus connection failed', [
                'royal_mail_order_id' => $royalMailOrderId,
                'exception' => $e->getMessage(),
            ]);

            return new TrackingInfo(status: 'error');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOrderPayload(Order $order): array
    {
        $address = $order->shipping_address;
        $items = collect($order->items_snapshot)->map(fn (array $item) => [
            'description' => $item['name'] ?? $item['description'] ?? 'Mushroom product',
            'quantity' => $item['quantity'] ?? 1,
            'weight' => $item['weight_grams'] ?? 500,
            'value' => ($item['price_pence'] ?? 0) / 100,
        ])->all();

        $totalWeight = collect($items)->sum(fn (array $item) => $item['weight'] * $item['quantity']);

        return [
            'items' => [
                [
                    'recipient' => [
                        'name' => $order->customer_name,
                        'addressLine1' => $address['line1'] ?? '',
                        'addressLine2' => $address['line2'] ?? '',
                        'city' => $address['city'] ?? '',
                        'county' => $address['county'] ?? '',
                        'postcode' => $address['postcode'] ?? '',
                        'countryCode' => 'GB',
                    ],
                    'orderReference' => $order->order_number,
                    'subtotal' => $order->subtotal_pence / 100,
                    'shippingCostPaid' => $order->shipping_pence / 100,
                    'total' => $order->total_pence / 100,
                    'weight' => $totalWeight,
                    'items' => $items,
                ],
            ],
        ];
    }

    /**
     * Sanitise payload for logging - strip PII, keep only postcode prefix.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function sanitisePayload(array $payload): array
    {
        $sanitised = $payload;

        foreach ($sanitised['items'] ?? [] as $index => $item) {
            if (isset($item['recipient'])) {
                $postcode = $item['recipient']['postcode'] ?? '';
                $postcodePrefix = explode(' ', $postcode)[0] ?? '';

                $sanitised['items'][$index]['recipient'] = [
                    'name' => '[REDACTED]',
                    'addressLine1' => '[REDACTED]',
                    'addressLine2' => '[REDACTED]',
                    'city' => '[REDACTED]',
                    'county' => '[REDACTED]',
                    'postcode' => $postcodePrefix . ' ***',
                    'countryCode' => $item['recipient']['countryCode'] ?? 'GB',
                ];
            }
        }

        return $sanitised;
    }

    /**
     * Sanitise response body for logging.
     *
     * @param mixed $body
     * @return mixed
     */
    private function sanitiseResponseBody(mixed $body): mixed
    {
        if (!is_array($body)) {
            return $body;
        }

        $sanitised = $body;

        // Remove any address fields that may be echoed back
        foreach (['address', 'recipient', 'shippingAddress'] as $key) {
            if (isset($sanitised[$key])) {
                $sanitised[$key] = '[REDACTED]';
            }
        }

        return $sanitised;
    }

    private function isRetryable(\Throwable $exception): bool
    {
        if ($exception instanceof ConnectionException) {
            return true;
        }

        if ($exception instanceof RequestException) {
            return $exception->response->status() >= 500;
        }

        return false;
    }

    private function logRequest(string $method, string $identifier, mixed $sanitisedPayload = null): void
    {
        Log::info("RoyalMail {$method} request", array_filter([
            'identifier' => $identifier,
            'payload' => $sanitisedPayload,
        ]));
    }

    private function logResponse(string $method, string $identifier, int $status, mixed $body = null): void
    {
        $level = $status >= 400 ? 'error' : 'info';

        Log::{$level}("RoyalMail {$method} response", [
            'identifier' => $identifier,
            'status' => $status,
            'body' => $body,
        ]);
    }
}
