<?php

namespace App\DTOs;

readonly class RoyalMailResponse
{
    public function __construct(
        public bool $success,
        public ?string $orderId = null,
        public ?string $error = null,
    ) {}

    public static function succeeded(string $orderId): self
    {
        return new self(success: true, orderId: $orderId);
    }

    public static function failed(string $error): self
    {
        return new self(success: false, error: $error);
    }
}
