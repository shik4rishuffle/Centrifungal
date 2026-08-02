<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'statamic_id',
    'name',
    'slug',
    'description',
    'category',
    'base_price_pence',
    'is_active',
    'images',
])]
class Product extends Model
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
            'base_price_pence' => 'integer',
            'is_active' => 'boolean',
            'images' => 'array',
        ];
    }

    /**
     * Get the variants for this product.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }
}
