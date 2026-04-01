<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'slug' => $this->slug,
            'category' => $this->category,
            'base_price_pence' => $this->base_price_pence,
            'images' => $this->images,
            'description' => $this->when(
                $request->route('slug') !== null,
                $this->description,
            ),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
        ];
    }
}
