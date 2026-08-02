<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly StripeService $stripeService,
    ) {}

    /**
     * Create a Stripe Checkout Session from client-side cart items.
     *
     * Expects a JSON body with an `items` array, each containing
     * `variantId` (the product_variants.id) and `quantity`.
     * Prices are always read from the database - never trusted from the client.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.variantId' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $cartItems = collect($request->input('items'));
        $variantIds = $cartItems->pluck('variantId')->unique()->all();

        $variants = ProductVariant::whereIn('id', $variantIds)
            ->with('product')
            ->get()
            ->keyBy('id');

        if ($variants->count() !== count($variantIds)) {
            $missing = array_diff($variantIds, $variants->keys()->all());
            abort(422, 'Some items are no longer available (variant IDs: ' . implode(', ', $missing) . ').');
        }

        $outOfStock = $cartItems->first(function ($item) use ($variants) {
            $variant = $variants->get($item['variantId']);
            return $variant && ! $variant->in_stock;
        });

        if ($outOfStock) {
            $variant = $variants->get($outOfStock['variantId']);
            abort(422, ($variant->name ?? 'An item') . ' is currently out of stock.');
        }

        $lineItems = $cartItems->map(function ($item) use ($variants) {
            $variant = $variants->get($item['variantId']);
            $productName = $variant->product->name ?? 'Product';

            return [
                'name' => $productName . ($variant->name !== 'Default' ? ' - ' . $variant->name : ''),
                'price_pence' => $variant->price_pence,
                'quantity' => (int) $item['quantity'],
            ];
        })->all();

        $checkoutUrl = $this->stripeService->createCheckoutSession($lineItems, []);

        return response()->json([
            'checkout_url' => $checkoutUrl,
        ]);
    }
}
