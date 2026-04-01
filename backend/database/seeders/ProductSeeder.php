<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $growLogs = [
            [
                'name' => 'Shiitake Grow Log',
                'slug' => 'shiitake-grow-log',
                'description' => 'Grow your own shiitake mushrooms at home with our ready-to-fruit hardwood log, inoculated with premium shiitake spawn.',
                'category' => 'grow-logs',
                'base_price_pence' => 1995,
                'variants' => [
                    ['name' => 'Small', 'sku' => 'GL-SHIITAKE-S', 'price_pence' => 1995, 'weight_grams' => 2000, 'sort_order' => 0],
                    ['name' => 'Medium', 'sku' => 'GL-SHIITAKE-M', 'price_pence' => 2495, 'weight_grams' => 3500, 'sort_order' => 1],
                    ['name' => 'Large', 'sku' => 'GL-SHIITAKE-L', 'price_pence' => 3495, 'weight_grams' => 5000, 'sort_order' => 2],
                ],
            ],
            [
                'name' => 'Oyster Grow Log',
                'slug' => 'oyster-grow-log',
                'description' => 'Our oyster mushroom grow log produces generous flushes of delicious oyster mushrooms. Perfect for beginners.',
                'category' => 'grow-logs',
                'base_price_pence' => 1795,
                'variants' => [
                    ['name' => 'Small', 'sku' => 'GL-OYSTER-S', 'price_pence' => 1795, 'weight_grams' => 1800, 'sort_order' => 0],
                    ['name' => 'Medium', 'sku' => 'GL-OYSTER-M', 'price_pence' => 2295, 'weight_grams' => 3200, 'sort_order' => 1],
                    ['name' => 'Large', 'sku' => 'GL-OYSTER-L', 'price_pence' => 3295, 'weight_grams' => 4800, 'sort_order' => 2],
                ],
            ],
            [
                'name' => "Lion's Mane Grow Log",
                'slug' => 'lions-mane-grow-log',
                'description' => "Grow stunning lion's mane mushrooms from this inoculated hardwood log. Known for their unique texture and cognitive health benefits.",
                'category' => 'grow-logs',
                'base_price_pence' => 2295,
                'variants' => [
                    ['name' => 'Small', 'sku' => 'GL-LIONSMANE-S', 'price_pence' => 2295, 'weight_grams' => 2200, 'sort_order' => 0],
                    ['name' => 'Medium', 'sku' => 'GL-LIONSMANE-M', 'price_pence' => 2795, 'weight_grams' => 3800, 'sort_order' => 1],
                    ['name' => 'Large', 'sku' => 'GL-LIONSMANE-L', 'price_pence' => 3795, 'weight_grams' => 5200, 'sort_order' => 2],
                ],
            ],
        ];

        foreach ($growLogs as $data) {
            $variants = $data['variants'];
            unset($data['variants']);

            $product = Product::create($data);

            foreach ($variants as $variant) {
                $product->variants()->create($variant);
            }
        }

        // Colonised Dowels
        $dowels = Product::create([
            'name' => 'Colonised Dowels',
            'slug' => 'colonised-dowels',
            'description' => 'Hardwood dowels fully colonised with mushroom mycelium. Drill, plug, and seal your own logs to grow mushrooms for years.',
            'category' => 'supplies',
            'base_price_pence' => 895,
        ]);

        $dowels->variants()->create([
            'name' => 'Pack of 50',
            'sku' => 'CD-50',
            'price_pence' => 895,
            'weight_grams' => 400,
            'sort_order' => 0,
        ]);

        // DIY Mushroom Growing Kit
        $diyKit = Product::create([
            'name' => 'DIY Mushroom Growing Kit',
            'slug' => 'diy-mushroom-growing-kit',
            'description' => 'Everything you need to start growing gourmet mushrooms at home. Includes substrate, spawn, and step-by-step instructions.',
            'category' => 'kits',
            'base_price_pence' => 2495,
        ]);

        $diyKit->variants()->create([
            'name' => 'Starter',
            'sku' => 'KIT-STARTER',
            'price_pence' => 2495,
            'weight_grams' => 1500,
            'sort_order' => 0,
        ]);

        $diyKit->variants()->create([
            'name' => 'Deluxe',
            'sku' => 'KIT-DELUXE',
            'price_pence' => 3995,
            'weight_grams' => 2800,
            'sort_order' => 1,
        ]);

        // Lion's Mane Tincture
        $lionsTincture = Product::create([
            'name' => "Lion's Mane Tincture",
            'slug' => 'lions-mane-tincture',
            'description' => "Dual-extracted lion's mane tincture made from UK-grown fruiting bodies. Supports focus, memory, and nerve health.",
            'category' => 'tinctures',
            'base_price_pence' => 2495,
        ]);

        $lionsTincture->variants()->create([
            'name' => '50ml Bottle',
            'sku' => 'TINC-LIONSMANE-50',
            'price_pence' => 2495,
            'weight_grams' => 120,
            'sort_order' => 0,
        ]);

        // Reishi Tincture
        $reishiTincture = Product::create([
            'name' => 'Reishi Tincture',
            'slug' => 'reishi-tincture',
            'description' => 'Dual-extracted reishi tincture from UK-grown fruiting bodies. Traditionally used to support immunity and relaxation.',
            'category' => 'tinctures',
            'base_price_pence' => 2495,
        ]);

        $reishiTincture->variants()->create([
            'name' => '50ml Bottle',
            'sku' => 'TINC-REISHI-50',
            'price_pence' => 2495,
            'weight_grams' => 120,
            'sort_order' => 0,
        ]);
    }
}
