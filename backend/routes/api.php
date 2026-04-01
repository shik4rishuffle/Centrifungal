<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ContactController;
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
