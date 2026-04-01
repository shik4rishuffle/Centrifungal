<?php

namespace App\Models;

use App\Mail\OrderConfirmation;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
    'shipping_notification_sent_at',
    'delivered_at',
    'reconciled_at',
])]
class Order extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::created(function (Order $order) {
            if ($order->status === 'paid') {
                try {
                    Mail::send(new OrderConfirmation($order));
                } catch (\Throwable $e) {
                    Log::error('Failed to send order confirmation email: ' . $e->getMessage());
                }
            }
        });
    }

    private const STATUS_ORDER = [
        'pending' => 0,
        'paid' => 1,
        'fulfilled' => 2,
        'shipped' => 3,
        'delivered' => 4,
    ];

    public function transitionStatus(string $newStatus): void
    {
        $currentRank = self::STATUS_ORDER[$this->status] ?? -1;
        $newRank = self::STATUS_ORDER[$newStatus] ?? -1;

        if ($newRank <= $currentRank) {
            throw new \DomainException(
                "Cannot transition order from '{$this->status}' to '{$newStatus}'."
            );
        }

        $this->status = $newStatus;
        $this->save();
    }

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
            'shipping_notification_sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'reconciled_at' => 'datetime',
        ];
    }
}
