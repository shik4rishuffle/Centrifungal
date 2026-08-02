<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use Symfony\Component\HttpFoundation\Response;

class VerifyStripeSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('Stripe-Signature');
        $secret = config('services.stripe.webhook_secret');

        if (! $signature || ! $secret) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        try {
            Webhook::constructEvent(
                $request->getContent(),
                $signature,
                $secret,
            );
        } catch (SignatureVerificationException) {
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        return $next($request);
    }
}
