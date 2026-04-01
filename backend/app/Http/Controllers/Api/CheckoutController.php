<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartSession;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly StripeService $stripeService,
    ) {}

    /**
     * Create a Stripe Checkout Session from the current cart.
     */
    public function store(Request $request): JsonResponse
    {
        $token = $request->header('X-Cart-Token');

        $cart = null;

        if ($token) {
            $cart = CartSession::where('session_token', $token)
                ->where('expires_at', '>', now())
                ->first();
        }

        if (! $cart) {
            abort(401, 'Invalid or missing cart token.');
        }

        $cart->load('items.productVariant');

        if ($cart->items->isEmpty()) {
            abort(422, 'Cart is empty.');
        }

        $outOfStock = $cart->items->first(fn ($item) => ! $item->productVariant->in_stock);

        if ($outOfStock) {
            abort(422, 'One or more items in your cart are out of stock.');
        }

        $lineItems = $cart->items->map(fn ($item) => [
            'name' => $item->productVariant->name,
            'price_pence' => $item->productVariant->price_pence,
            'quantity' => $item->quantity,
        ])->all();

        $metadata = [
            'cart_session_id' => $cart->id,
        ];

        $checkoutUrl = $this->stripeService->createCheckoutSession($lineItems, $metadata);

        return response()->json([
            'checkout_url' => $checkoutUrl,
        ]);
    }
}
