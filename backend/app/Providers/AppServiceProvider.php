<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureSqlite();
        $this->configureRateLimiting();
    }

    /**
     * Configure API rate limiters.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api-public', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('api-cart', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        RateLimiter::for('api-checkout', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('api-contact', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('cp-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }

    /**
     * Configure SQLite pragmas for performance and correctness.
     *
     * Requires SQLite 3.52.0+ to avoid the WAL-reset bug where the WAL file
     * could be silently reset to rollback journal mode after certain operations.
     */
    private function configureSqlite(): void
    {
        if (DB::connection()->getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA journal_mode = WAL');
        DB::statement('PRAGMA busy_timeout = 5000');
        DB::statement('PRAGMA synchronous = NORMAL');
        DB::statement('PRAGMA foreign_keys = ON');
    }
}
