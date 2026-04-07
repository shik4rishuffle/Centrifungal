<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\FooterController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Middleware\ResolveCartSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Product Endpoints
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:api-public')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    Route::get('/homepage', [PageController::class, 'homepage']);
    Route::get('/pages', [PageController::class, 'index']);
    Route::get('/pages/{slug}', [PageController::class, 'show']);

    Route::get('/footer', FooterController::class);

    Route::get('/navigation', function (): JsonResponse {
        $nav = \Statamic\Facades\Nav::find('main_nav');
        if (! $nav) {
            return response()->json(['data' => []])->header('Cache-Control', 'public, max-age=300');
        }

        $site = \Statamic\Facades\Site::current()->handle();
        $tree = $nav->in($site);

        if (! $tree) {
            return response()->json(['data' => []])->header('Cache-Control', 'public, max-age=300');
        }

        $items = collect($tree->flattenedPages())->map(function ($page) {
            return [
                'title' => $page->title(),
                'url' => $page->url() ?? $page->uri(),
            ];
        })->values()->all();

        return response()->json(['data' => $items])
            ->header('Cache-Control', 'public, max-age=300');
    });
});

/*
|--------------------------------------------------------------------------
| Frontend Config
|--------------------------------------------------------------------------
| Exposes non-secret environment config to the static frontend.
*/
Route::get('/random-no', function (): JsonResponse {
    try {
        $response = \Illuminate\Support\Facades\Http::timeout(5)
            ->get('https://no-as-a-service.onrender.com/no');

        if ($response->ok()) {
            return response()->json($response->json())
                ->header('Cache-Control', 'public, max-age=60');
        }
    } catch (\Throwable) {
        // fall through
    }

    return response()->json(['reason' => 'No.']);
});

Route::get('/config', function (): JsonResponse {
    return response()->json([
        'api_base_url' => config('app.url'),
    ])->header('Cache-Control', 'public, max-age=3600');
});

/*
|--------------------------------------------------------------------------
| Cart Endpoints
|--------------------------------------------------------------------------
*/
Route::middleware(['throttle:api-cart', ResolveCartSession::class])->prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/items', [CartController::class, 'addItem']);
    Route::patch('/items/{cartItem}', [CartController::class, 'updateItem']);
    Route::delete('/items/{cartItem}', [CartController::class, 'removeItem']);
});

/*
|--------------------------------------------------------------------------
| Checkout Endpoints
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:api-checkout')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Contact Form
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:api-contact')->group(function () {
    Route::post('/contact', ContactController::class);
});

/*
|--------------------------------------------------------------------------
| Health Check (TASK-003)
|--------------------------------------------------------------------------
| Used by Railway's healthcheck to verify the app is running.
| Checks PHP, nginx (implicitly - we're responding), and SQLite connectivity.
*/
Route::get('/health', function (): JsonResponse {
    try {
        DB::connection()->getPdo();
        $dbOk = true;
    } catch (\Throwable $e) {
        $dbOk = false;
    }

    $status = $dbOk ? 'healthy' : 'degraded';
    $httpCode = $dbOk ? 200 : 503;

    return response()->json([
        'status' => $status,
        'database' => $dbOk ? 'connected' : 'unreachable',
        'timestamp' => now()->toIso8601String(),
    ], $httpCode);
});
