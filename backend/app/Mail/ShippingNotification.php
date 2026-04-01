<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShippingNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Order Has Shipped - ' . $this->order->order_number,
            to: [$this->order->customer_email],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shipping-notification',
            with: [
                'order' => $this->order,
            ],
        );
    }
}
