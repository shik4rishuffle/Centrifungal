<?php

namespace Database\Factories;

use App\Models\CartSession;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CartSession>
 */
class CartSessionFactory extends Factory
{
    protected $model = CartSession::class;

    public function definition(): array
    {
        return [
            'session_token' => Str::uuid()->toString(),
            'expires_at' => now()->addDays(7),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
