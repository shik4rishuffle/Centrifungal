<?php

namespace App\DTOs;

readonly class TrackingInfo
{
    public function __construct(
        public ?string $trackingNumber = null,
        public ?string $trackingUrl = null,
        public string $status = 'unknown',
    ) {}
}
