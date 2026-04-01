<?php

namespace Database\Factories;

use App\Models\CartItem;
use App\Models\CartSession;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CartItem>
 */
class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        return [
            'cart_session_id' => CartSession::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'quantity' => $this->faker->numberBetween(1, 5),
        ];
    }
}
