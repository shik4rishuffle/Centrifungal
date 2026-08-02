<?php

namespace App\Services;

class StripeService
{
    /**
     * List completed checkout sessions from the last 24 hours.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listCompletedSessions(): array
    {
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

        $since = now()->subDay()->timestamp;

        $sessions = $stripe->checkout->sessions->all([
            'limit' => 100,
            'created' => ['gte' => $since],
            'status' => 'complete',
        ]);

        return array_values(array_map(fn ($s) => $s->toArray(), $sessions->data));
    }

    /**
     * Create a Stripe Checkout Session and return the checkout URL.
     *
     * @param array<int, array{name: string, price_pence: int, quantity: int}> $lineItems
     * @param array<string, mixed> $metadata
     */
    public function createCheckoutSession(array $lineItems, array $metadata): string
    {
        $secret = config('services.stripe.secret');

        if (empty($secret)) {
            throw new \RuntimeException('Stripe secret key is not configured. Set STRIPE_SECRET in your .env file.');
        }

        $stripe = new \Stripe\StripeClient($secret);

        $stripeLineItems = array_map(fn (array $item) => [
            'price_data' => [
                'currency' => 'gbp',
                'product_data' => [
                    'name' => $item['name'],
                ],
                'unit_amount' => $item['price_pence'],
            ],
            'quantity' => $item['quantity'],
        ], $lineItems);

        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'line_items' => $stripeLineItems,
            'metadata' => $metadata,
            'success_url' => config('app.frontend_url') . '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => config('app.frontend_url') . '/checkout/cancel',
        ]);

        return $session->url;
    }
}
