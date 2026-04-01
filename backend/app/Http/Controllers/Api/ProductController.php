<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * List all active products with variants, optionally filtered by category.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::where('is_active', true)
            ->with('variants')
            ->orderBy('name');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $products = $query->paginate(20);

        return ProductResource::collection($products)
            ->response()
            ->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * Show a single product by slug with all variants and full description.
     */
    public function show(string $slug): JsonResponse
    {
        $product = Product::where('is_active', true)
            ->where('slug', $slug)
            ->with('variants')
            ->first();

        if (! $product) {
            return response()->json([
                'message' => 'Product not found.',
            ], 404)->header('Cache-Control', 'public, max-age=300');
        }

        return (new ProductResource($product))
            ->response()
            ->header('Cache-Control', 'public, max-age=300');
    }

    /**
     * List distinct categories with product counts.
     */
    public function categories(): JsonResponse
    {
        $categories = Product::where('is_active', true)
            ->selectRaw('category, count(*) as product_count')
            ->groupBy('category')
            ->orderBy('category')
            ->get();

        return response()->json([
            'data' => $categories,
        ])->header('Cache-Control', 'public, max-age=300');
    }
}
