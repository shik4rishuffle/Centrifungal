<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\CartSession;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();

        $eventType = $payload['type'] ?? null;

        if ($eventType !== 'checkout.session.completed') {
            return response()->json(['message' => 'Event type not handled'], 200);
        }

        $session = $payload['data']['object'] ?? [];
        $sessionId = $session['id'] ?? null;

        // Idempotency: if an order already exists for this checkout session, return 200.
        if (Order::where('stripe_checkout_session_id', $sessionId)->exists()) {
            return response()->json(['message' => 'Already processed'], 200);
        }

        $cartToken = $session['client_reference_id'] ?? null;
        $cart = CartSession::where('session_token', $cartToken)->first();

        if (! $cart) {
            return response()->json(['message' => 'Cart not found'], 400);
        }

        $cartItems = $cart->items()->with('productVariant.product')->get();

        $itemsSnapshot = $cartItems->map(function ($cartItem) {
            $variant = $cartItem->productVariant;
            $product = $variant->product;

            return [
                'name' => $product->name . ' - ' . $variant->name,
                'quantity' => $cartItem->quantity,
                'price_pence' => $variant->price_pence,
                'weight_grams' => $variant->weight_grams,
                'sku' => $variant->sku,
            ];
        })->values()->toArray();

        $customerDetails = $session['customer_details'] ?? [];
        $shippingDetails = $session['shipping_details'] ?? [];

        DB::transaction(function () use ($session, $sessionId, $cart, $customerDetails, $shippingDetails, $itemsSnapshot) {
            $orderNumber = $this->generateOrderNumber();

            Order::create([
                'order_number' => $orderNumber,
                'stripe_checkout_session_id' => $sessionId,
                'stripe_payment_intent_id' => $session['payment_intent'] ?? null,
                'status' => 'paid',
                'customer_name' => $customerDetails['name'] ?? null,
                'customer_email' => $customerDetails['email'] ?? null,
                'shipping_address' => $shippingDetails['address'] ?? null,
                'items_snapshot' => $itemsSnapshot,
                'subtotal_pence' => $session['amount_subtotal'] ?? 0,
                'shipping_pence' => $session['shipping_cost']['amount_total'] ?? 0,
                'total_pence' => $session['amount_total'] ?? 0,
            ]);

            // Clear the cart items.
            $cart->items()->delete();
        });

        return response()->json(['message' => 'Order created'], 200);
    }

    private function generateOrderNumber(): string
    {
        $datePart = now()->format('Ymd');
        $todayCount = Order::where('order_number', 'like', "CF-{$datePart}-%")->count();
        $sequence = str_pad((string) ($todayCount + 1), 4, '0', STR_PAD_LEFT);

        return "CF-{$datePart}-{$sequence}";
    }
}
