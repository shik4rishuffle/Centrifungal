<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'name' => $this->name,
            'sku' => $this->sku,
            'price_pence' => $this->price_pence,
            'weight_grams' => $this->weight_grams,
            'in_stock' => $this->in_stock,
            'sort_order' => $this->sort_order,
        ];
    }
}
