<?php

namespace App\Widgets;

use App\Models\Order;
use Statamic\Widgets\Widget;

class RecentOrdersWidget extends Widget
{
    /**
     * The HTML that should be shown in the widget.
     */
    public function html()
    {
        try {
            $orders = Order::query()
                ->orderByDesc('created_at')
                ->limit($this->config('limit', 10))
                ->get();

            return view('widgets.recent_orders', [
                'orders' => $orders,
                'title' => $this->config('title', 'Recent Orders'),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('RecentOrdersWidget failed: '.$e->getMessage());

            return '<div class="card p-4"><p class="text-grey-70">Recent Orders widget unavailable: '.e($e->getMessage()).'</p></div>';
        }
    }
}
