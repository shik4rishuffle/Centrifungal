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
        $orders = Order::query()
            ->orderByDesc('created_at')
            ->limit($this->config('limit', 10))
            ->get();

        return view('widgets.recent_orders', [
            'orders' => $orders,
            'title' => $this->config('title', 'Recent Orders'),
        ]);
    }
}
