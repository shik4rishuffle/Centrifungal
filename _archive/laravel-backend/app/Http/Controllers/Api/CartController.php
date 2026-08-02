<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Models\CartSession;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Get the current cart with items, variant details, line totals, and cart total.
     */
    public function index(Request $request): CartResource
    {
        $cart = $this->getCart($request);

        return new CartResource($cart);
    }

    /**
     * Add an item to the cart. Upserts if the variant is already present.
     */
    public function addItem(Request $request): CartResource
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $variant = ProductVariant::find($validated['variant_id']);

        if (! $variant) {
            abort(422, 'The selected variant does not exist.');
        }

        if (! $variant->in_stock) {
            abort(422, 'This variant is out of stock.');
        }

        $cart = $this->getCart($request);

        $existingItem = $cart->items()
            ->where('product_variant_id', $variant->id)
            ->first();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $validated['quantity'],
            ]);
        } else {
            $cart->items()->create([
                'product_variant_id' => $variant->id,
                'quantity' => $validated['quantity'],
            ]);
        }

        $cart->load('items.productVariant');

        return new CartResource($cart);
    }

    /**
     * Update the quantity of a cart item. Quantity 0 removes the item.
     */
    public function updateItem(Request $request, CartItem $cartItem): CartResource
    {
        $cart = $this->getCart($request);

        if ($cartItem->cart_session_id !== $cart->id) {
            abort(404);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
        ]);

        if ($validated['quantity'] === 0) {
            $cartItem->delete();
        } else {
            $cartItem->update(['quantity' => $validated['quantity']]);
        }

        $cart->load('items.productVariant');

        return new CartResource($cart);
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(Request $request, CartItem $cartItem): CartResource
    {
        $cart = $this->getCart($request);

        if ($cartItem->cart_session_id !== $cart->id) {
            abort(404);
        }

        $cartItem->delete();

        $cart->load('items.productVariant');

        return new CartResource($cart);
    }

    /**
     * Resolve the cart session from the request attributes.
     */
    private function getCart(Request $request): CartSession
    {
        return $request->attributes->get('cart_session');
    }
}
