<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(1000, 8000);
        $shipping = 395;

        return [
            'order_number' => 'CF-' . $this->faker->unique()->numerify('######'),
            'stripe_payment_intent_id' => 'pi_' . $this->faker->unique()->regexify('[A-Za-z0-9]{24}'),
            'stripe_checkout_session_id' => 'cs_' . $this->faker->regexify('[A-Za-z0-9]{24}'),
            'status' => 'pending',
            'customer_name' => $this->faker->name(),
            'customer_email' => $this->faker->safeEmail(),
            'shipping_address' => [
                'line1' => $this->faker->streetAddress(),
                'line2' => $this->faker->optional()->secondaryAddress(),
                'city' => $this->faker->city(),
                'county' => $this->faker->state(),
                'postcode' => $this->faker->postcode(),
            ],
            'items_snapshot' => [
                [
                    'name' => 'Shiitake Grow Log - Medium',
                    'description' => 'Shiitake mushroom grow log',
                    'quantity' => 1,
                    'price_pence' => $subtotal,
                    'weight_grams' => 800,
                ],
            ],
            'subtotal_pence' => $subtotal,
            'shipping_pence' => $shipping,
            'total_pence' => $subtotal + $shipping,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'shipped',
            'royal_mail_order_id' => 'RM-' . $this->faker->numerify('######'),
            'tracking_number' => $this->faker->regexify('[A-Z]{2}[0-9]{9}GB'),
            'tracking_url' => 'https://www.royalmail.com/track-your-item#/tracking-results/' . $this->faker->regexify('[A-Z]{2}[0-9]{9}GB'),
            'shipped_at' => now()->subDays(2),
        ]);
    }

    public function delivered(): static
    {
        return $this->shipped()->state(fn (array $attributes) => [
            'status' => 'delivered',
            'delivered_at' => now()->subDay(),
        ]);
    }
}
