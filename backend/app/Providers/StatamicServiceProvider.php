<?php

namespace App\Providers;

use App\Http\Controllers\CP\ContactSubmissionsController;
use App\Http\Controllers\CP\OrdersController;
use App\Listeners\SyncProductToDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Statamic\Events\EntryDeleted;
use Statamic\Events\EntrySaved;
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
        $this->registerEventListeners();
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

            $nav->content('Contact Submissions')
                ->section('Tools')
                ->route('cp.contact-submissions.index')
                ->icon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.953 5.468a1.5 1.5 0 0 1-1.594 0L2.25 6.75"/></svg>');
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

            Route::prefix('contact-submissions')->name('contact-submissions.')->group(function () {
                Route::get('/', [ContactSubmissionsController::class, 'index'])->name('index');
                Route::get('/{submission}', [ContactSubmissionsController::class, 'show'])->name('show');
            });
        });
    }

    /**
     * Register Statamic event listeners for CMS-to-database sync.
     */
    private function registerEventListeners(): void
    {
        $listener = app(SyncProductToDatabase::class);

        Event::listen(EntrySaved::class, [$listener, 'handleSaved']);
        Event::listen(EntryDeleted::class, [$listener, 'handleDeleted']);
    }
}
