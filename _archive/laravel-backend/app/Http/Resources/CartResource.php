<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->loadMissing('items.productVariant');

        $items = CartItemResource::collection($this->items);

        return [
            'cart_token' => $this->session_token,
            'expires_at' => $this->expires_at->toIso8601String(),
            'items' => $items,
            'total_pence' => $this->items->sum(function ($item) {
                return $item->quantity * $item->productVariant->price_pence;
            }),
        ];
    }
}
