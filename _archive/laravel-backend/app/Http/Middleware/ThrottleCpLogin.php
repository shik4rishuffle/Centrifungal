<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Symfony\Component\HttpFoundation\Response;

/**
 * Apply rate limiting specifically to Statamic CP login POST requests.
 *
 * This middleware is pushed onto the 'statamic.cp' middleware group so it
 * runs for all CP routes, but it only enforces the 'cp-login' rate limiter
 * on POST requests to the auth/login path.
 */
class ThrottleCpLogin
{
    public function __construct(
        private ThrottleRequests $throttle,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('POST') && $request->is('*/auth/login')) {
            return $this->throttle->handle($request, $next, 'cp-login');
        }

        return $next($request);
    }
}
