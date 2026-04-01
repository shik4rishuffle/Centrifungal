<?php

namespace App\Http\Controllers\CP;

use App\Models\Order;
use Illuminate\Routing\Controller;
use Statamic\Http\Middleware\CP\Authenticate;

class OrdersController extends Controller
{
    public function __construct()
    {
        $this->middleware(Authenticate::class);
    }

    /**
     * Show a read-only listing of all orders in the CP.
     */
    public function index()
    {
        $orders = Order::query()
            ->orderByDesc('created_at')
            ->paginate(25);

        return view('cp.orders.index', [
            'orders' => $orders,
            'title' => 'Orders',
        ]);
    }

    /**
     * Show a single order's details (read-only).
     */
    public function show(Order $order)
    {
        return view('cp.orders.show', [
            'order' => $order,
            'title' => 'Order #' . $order->order_number,
        ]);
    }
}
