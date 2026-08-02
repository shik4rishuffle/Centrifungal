<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => $this->faker->randomElement(['Small', 'Medium', 'Large', 'Extra Large']),
            'sku' => strtoupper($this->faker->unique()->bothify('MR-###-??')),
            'price_pence' => $this->faker->numberBetween(800, 4500),
            'weight_grams' => $this->faker->numberBetween(200, 2000),
            'in_stock' => true,
            'sort_order' => $this->faker->numberBetween(0, 10),
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'in_stock' => false,
        ]);
    }
}
