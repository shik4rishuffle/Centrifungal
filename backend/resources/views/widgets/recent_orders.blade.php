<div class="card p-0">
    <div class="flex justify-between items-center p-4 border-b">
        <h2 class="font-bold text-lg">{{ $title }}</h2>
        <span class="text-grey-60 text-sm">Last {{ count($orders) }} orders</span>
    </div>

    @if($orders->isEmpty())
        <div class="p-4 text-grey-60 text-center">
            No orders yet.
        </div>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @foreach($orders as $order)
                    <tr>
                        <td class="font-mono text-sm">{{ $order->order_number }}</td>
                        <td>{{ $order->customer_name }}</td>
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
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</div>
