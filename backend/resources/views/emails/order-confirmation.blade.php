<h1>Order Confirmation</h1>

<p>Thank you for your order!</p>

<p><strong>Order Number:</strong> {{ $order->order_number }}</p>

<h2>Items</h2>
<table>
    <thead>
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($order->items_snapshot as $item)
            <tr>
                <td>{{ $item['name'] }}</td>
                <td>{{ $item['quantity'] }}</td>
                <td>&pound;{{ number_format($item['price_pence'] / 100, 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<p><strong>Subtotal:</strong> &pound;{{ number_format($order->subtotal_pence / 100, 2) }}</p>
<p><strong>Shipping:</strong> &pound;{{ number_format($order->shipping_pence / 100, 2) }}</p>
<p><strong>Total:</strong> &pound;{{ number_format($order->total_pence / 100, 2) }}</p>

<h2>Shipping Address</h2>
<p>
    {{ $order->shipping_address['line1'] }}<br>
    @if (!empty($order->shipping_address['line2']))
        {{ $order->shipping_address['line2'] }}<br>
    @endif
    {{ $order->shipping_address['city'] }}<br>
    @if (!empty($order->shipping_address['county']))
        {{ $order->shipping_address['county'] }}<br>
    @endif
    {{ $order->shipping_address['postcode'] }}
</p>
