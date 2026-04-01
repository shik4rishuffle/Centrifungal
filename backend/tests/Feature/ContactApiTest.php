<?php

namespace Tests\Feature;

use App\Models\ContactSubmission;
use App\Notifications\ContactFormNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ContactApiTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'message' => 'Hello, I have a question about your mushroom kits.',
        ], $overrides);
    }

    public function test_valid_submission_returns_201_and_creates_db_record(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload());

        $response->assertCreated();
        $response->assertJsonStructure([
            'message',
        ]);

        $this->assertDatabaseHas('contact_submissions', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
    }

    public function test_missing_name_returns_422_with_validation_error(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'name' => '',
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_missing_email_returns_422_with_validation_error(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'email' => '',
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_invalid_email_returns_422_with_validation_error(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'email' => 'not-an-email',
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_missing_message_returns_422_with_validation_error(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'message' => '',
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['message']);
    }

    public function test_honeypot_field_filled_returns_422(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload([
            'phone_confirm' => 'I am a bot',
        ]));

        $response->assertStatus(422);
    }

    public function test_owner_receives_notification_email_with_submission_details(): void
    {
        Mail::fake();

        $payload = $this->validPayload();
        $response = $this->postJson('/api/contact', $payload);

        $response->assertCreated();

        Mail::assertSent(ContactFormNotification::class, function ($mail) use ($payload) {
            return $mail->hasTo(config('mail.contact_recipient'))
                && str_contains($mail->render(), $payload['name'])
                && str_contains($mail->render(), $payload['message']);
        });
    }

    public function test_ip_address_is_stored_on_the_record(): void
    {
        $response = $this->postJson('/api/contact', $this->validPayload());

        $response->assertCreated();

        $this->assertDatabaseHas('contact_submissions', [
            'ip_address' => '127.0.0.1',
        ]);
    }

    public function test_rate_limit_rejects_excessive_submissions(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $response = $this->postJson('/api/contact', $this->validPayload([
                'name' => "Sender {$i}",
            ]));
            $response->assertCreated();
        }

        // Fourth request within the same minute should be rate-limited
        $response = $this->postJson('/api/contact', $this->validPayload([
            'name' => 'Sender 3',
        ]));

        $response->assertStatus(429);
    }
}
