<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    private const MUSHROOM_NAMES = [
        'Shiitake Grow Log',
        'Oyster Mushroom Kit',
        'Lions Mane Fruiting Block',
        'Pink Oyster Grow Bag',
        'Reishi Mushroom Log',
        'King Oyster Substrate',
        'Chestnut Mushroom Kit',
        'Maitake Grow Block',
        'Enoki Growing Kit',
        'Nameko Mushroom Log',
    ];

    private const CATEGORIES = [
        'grow-logs',
        'grow-kits',
        'substrates',
        'accessories',
        'spawn',
    ];

    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement(self::MUSHROOM_NAMES);

        return [
            'statamic_id' => $this->faker->uuid(),
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $this->faker->paragraphs(2, true),
            'category' => $this->faker->randomElement(self::CATEGORIES),
            'base_price_pence' => $this->faker->numberBetween(800, 4500),
            'is_active' => true,
            'images' => [$this->faker->imageUrl(640, 480, 'nature')],
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
