<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Middleware\ResolveCartSession;
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
Route::middleware('throttle:api-checkout')->prefix('checkout')->group(function () {
    // Checkout routes will be added when CheckoutController is implemented.
});

/*
|--------------------------------------------------------------------------
| Contact Form
|--------------------------------------------------------------------------
*/
Route::middleware('throttle:api-contact')->group(function () {
    // Contact route will be added when ContactController is implemented.
});
