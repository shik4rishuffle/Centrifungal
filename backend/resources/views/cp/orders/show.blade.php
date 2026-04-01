@extends('statamic::layout')

@section('title', $title)

@section('content')

<div class="mb-6">
    <a href="{{ cp_route('orders.index') }}" class="text-blue hover:text-blue-dark text-sm">&larr; Back to Orders</a>
</div>

<div class="flex items-center justify-between mb-6">
    <h1>{{ $title }}</h1>
    @php
        $statusColours = [
            'pending' => 'bg-grey-30 text-grey-80',
            'paid' => 'bg-green-lighter text-green-dark',
            'fulfilled' => 'bg-blue-lighter text-blue-dark',
            'shipped' => 'bg-purple-lighter text-purple-dark',
            'delivered' => 'bg-green-lighter text-green-darker',
        ];
        $colour = $statusColours[$order->status] ?? 'bg-grey-30 text-grey-80';
    @endphp
    <span class="inline-block px-3 py-1 rounded text-sm font-medium {{ $colour }}">
        {{ ucfirst($order->status) }}
    </span>
</div>

<div class="flex flex-wrap -mx-2">
    {{-- Customer details --}}
    <div class="w-1/2 px-2 mb-4">
        <div class="card p-4">
            <h2 class="font-bold text-lg mb-4">Customer</h2>
            <dl class="space-y-2">
                <div>
                    <dt class="text-grey-60 text-sm">Name</dt>
                    <dd>{{ $order->customer_name }}</dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">Email</dt>
                    <dd>{{ $order->customer_email }}</dd>
                </div>
                @if($order->shipping_address)
                    <div>
                        <dt class="text-grey-60 text-sm">Shipping Address</dt>
                        <dd>
                            @foreach(array_filter($order->shipping_address) as $line)
                                {{ $line }}<br>
                            @endforeach
                        </dd>
                    </div>
                @endif
            </dl>
        </div>
    </div>

    {{-- Order summary --}}
    <div class="w-1/2 px-2 mb-4">
        <div class="card p-4">
            <h2 class="font-bold text-lg mb-4">Summary</h2>
            <dl class="space-y-2">
                <div>
                    <dt class="text-grey-60 text-sm">Order Number</dt>
                    <dd class="font-mono">{{ $order->order_number }}</dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">Date</dt>
                    <dd>{{ $order->created_at->format('j M Y, H:i') }}</dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">Subtotal</dt>
                    <dd>&pound;{{ number_format($order->subtotal_pence / 100, 2) }}</dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">Shipping</dt>
                    <dd>&pound;{{ number_format($order->shipping_pence / 100, 2) }}</dd>
                </div>
                <div class="border-t pt-2">
                    <dt class="text-grey-60 text-sm font-bold">Total</dt>
                    <dd class="font-bold text-lg">&pound;{{ number_format($order->total_pence / 100, 2) }}</dd>
                </div>
            </dl>
        </div>
    </div>

    {{-- Tracking info --}}
    @if($order->tracking_number || $order->shipped_at)
        <div class="w-full px-2 mb-4">
            <div class="card p-4">
                <h2 class="font-bold text-lg mb-4">Shipping & Tracking</h2>
                <dl class="space-y-2">
                    @if($order->tracking_number)
                        <div>
                            <dt class="text-grey-60 text-sm">Tracking Number</dt>
                            <dd class="font-mono">
                                @if($order->tracking_url)
                                    <a href="{{ $order->tracking_url }}" target="_blank" rel="noopener" class="text-blue hover:text-blue-dark">
                                        {{ $order->tracking_number }}
                                    </a>
                                @else
                                    {{ $order->tracking_number }}
                                @endif
                            </dd>
                        </div>
                    @endif
                    @if($order->shipped_at)
                        <div>
                            <dt class="text-grey-60 text-sm">Shipped</dt>
                            <dd>{{ $order->shipped_at->format('j M Y, H:i') }}</dd>
                        </div>
                    @endif
                    @if($order->delivered_at)
                        <div>
                            <dt class="text-grey-60 text-sm">Delivered</dt>
                            <dd>{{ $order->delivered_at->format('j M Y, H:i') }}</dd>
                        </div>
                    @endif
                </dl>
            </div>
        </div>
    @endif

    {{-- Order items --}}
    <div class="w-full px-2 mb-4">
        <div class="card p-0">
            <div class="p-4 border-b">
                <h2 class="font-bold text-lg">Items</h2>
            </div>
            @if($order->items_snapshot && count($order->items_snapshot) > 0)
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Variant</th>
                            <th>Qty</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items_snapshot as $item)
                            <tr>
                                <td>{{ $item['name'] ?? '-' }}</td>
                                <td>{{ $item['variant_name'] ?? '-' }}</td>
                                <td>{{ $item['quantity'] ?? 1 }}</td>
                                <td>&pound;{{ number_format(($item['price_pence'] ?? 0) / 100, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <div class="p-4 text-grey-60">No item details available.</div>
            @endif
        </div>
    </div>
</div>

@endsection
