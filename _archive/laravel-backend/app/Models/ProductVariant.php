<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'product_id',
    'name',
    'sku',
    'price_pence',
    'weight_grams',
    'in_stock',
    'sort_order',
])]
class ProductVariant extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_pence' => 'integer',
            'weight_grams' => 'integer',
            'in_stock' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the product that owns this variant.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
