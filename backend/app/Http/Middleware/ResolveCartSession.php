<?php

namespace App\Http\Middleware;

use App\Models\CartSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ResolveCartSession
{
    /**
     * Resolve or create a cart session from the X-Cart-Token header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Cart-Token');

        $cart = null;

        if ($token) {
            $cart = CartSession::where('session_token', $token)
                ->where('expires_at', '>', now())
                ->first();
        }

        if (! $cart) {
            $cart = CartSession::create([
                'session_token' => Str::uuid()->toString(),
                'expires_at' => now()->addDays(7),
            ]);
        }

        $request->attributes->set('cart_session', $cart);

        $response = $next($request);

        $response->headers->set('X-Cart-Token', $cart->session_token);

        return $response;
    }
}
