<?php

namespace App\Services;

class StripeService
{
    /**
     * Create a Stripe Checkout Session and return the checkout URL.
     *
     * @param array<int, array{name: string, price_pence: int, quantity: int}> $lineItems
     * @param array<string, mixed> $metadata
     */
    public function createCheckoutSession(array $lineItems, array $metadata): string
    {
        $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

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
