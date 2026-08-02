<?php

use App\Http\Controllers\Webhook\StripeWebhookController;
use App\Http\Middleware\VerifyStripeSignature;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/webhook/stripe', StripeWebhookController::class)
    ->middleware(VerifyStripeSignature::class);
