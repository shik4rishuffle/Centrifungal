<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'variant' => [
                'id' => $this->productVariant->id,
                'name' => $this->productVariant->name,
                'sku' => $this->productVariant->sku,
                'price_pence' => $this->productVariant->price_pence,
                'in_stock' => $this->productVariant->in_stock,
            ],
            'line_total_pence' => $this->quantity * $this->productVariant->price_pence,
        ];
    }
}
