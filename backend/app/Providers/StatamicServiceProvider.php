<?php

namespace App\Providers;

use App\Http\Controllers\CP\OrdersController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Statamic\Facades\CP\Nav;
use Statamic\Statamic;

class StatamicServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap Statamic customisations.
     */
    public function boot(): void
    {
        $this->registerNavItems();
        $this->registerCpRoutes();
    }

    /**
     * Add custom navigation items to the CP sidebar.
     */
    private function registerNavItems(): void
    {
        Nav::extend(function ($nav) {
            $nav->content('Orders')
                ->section('Tools')
                ->route('cp.orders.index')
                ->icon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/></svg>');
        });
    }

    /**
     * Register CP routes for custom admin pages.
     */
    private function registerCpRoutes(): void
    {
        Statamic::pushCpRoutes(function () {
            Route::prefix('orders')->name('orders.')->group(function () {
                Route::get('/', [OrdersController::class, 'index'])->name('index');
                Route::get('/{order}', [OrdersController::class, 'show'])->name('show');
            });
        });
    }
}
