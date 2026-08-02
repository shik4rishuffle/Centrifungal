@extends('statamic::layout')

@section('title', $title)

@section('content')

<div class="flex items-center justify-between mb-6">
    <h1>{{ $title }}</h1>
</div>

<div class="card p-0">
    @if($orders->isEmpty())
        <div class="p-6 text-center text-grey-60">
            No orders have been placed yet.
        </div>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($orders as $order)
                    <tr>
                        <td class="font-mono text-sm">{{ $order->order_number }}</td>
                        <td>{{ $order->customer_name }}</td>
                        <td class="text-sm">{{ $order->customer_email }}</td>
                        <td>&pound;{{ number_format($order->total_pence / 100, 2) }}</td>
                        <td>
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
                            <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {{ $colour }}">
                                {{ ucfirst($order->status) }}
                            </span>
                        </td>
                        <td class="text-sm text-grey-70">{{ $order->created_at->format('j M Y, H:i') }}</td>
                        <td>
                            <a href="{{ cp_route('orders.show', $order->id) }}" class="text-blue hover:text-blue-dark">
                                View
                            </a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        @if($orders->hasPages())
            <div class="p-4 border-t">
                {{ $orders->links() }}
            </div>
        @endif
    @endif
</div>

@endsection
