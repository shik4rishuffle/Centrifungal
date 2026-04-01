<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'order_number',
    'stripe_payment_intent_id',
    'stripe_checkout_session_id',
    'status',
    'customer_name',
    'customer_email',
    'shipping_address',
    'items_snapshot',
    'subtotal_pence',
    'shipping_pence',
    'total_pence',
    'royal_mail_order_id',
    'tracking_number',
    'tracking_url',
    'shipped_at',
    'delivered_at',
    'reconciled_at',
])]
class Order extends Model
{
    use HasFactory;
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'shipping_address' => 'array',
            'items_snapshot' => 'array',
            'subtotal_pence' => 'integer',
            'shipping_pence' => 'integer',
            'total_pence' => 'integer',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'reconciled_at' => 'datetime',
        ];
    }
}
