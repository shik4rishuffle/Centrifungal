<h1>Your Order Has Shipped!</h1>

<p>Great news, {{ $order->customer_name }}! Your Centrifungal order is on its way.</p>

<p><strong>Order Number:</strong> {{ $order->order_number }}</p>

<h2>Tracking Information</h2>
<p><strong>Tracking Number:</strong> {{ $order->tracking_number }}</p>
<p><strong>Track your parcel:</strong> <a href="{{ $order->tracking_url }}">{{ $order->tracking_url }}</a></p>

<p>Estimated delivery is typically 1-3 working days from dispatch.</p>

<h2>Items Shipped</h2>
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

<p>Thank you for shopping with Centrifungal!</p>
