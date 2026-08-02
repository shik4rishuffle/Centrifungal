<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use App\Notifications\ContactFormNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if ($request->filled('phone_confirm')) {
            return response()->json(['message' => 'Validation failed.'], 422);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $submission = ContactSubmission::create([
            ...$validated,
            'ip_address' => $request->ip(),
        ]);

        Mail::to(config('mail.contact_recipient'))->send(
            new ContactFormNotification($submission),
        );

        return response()->json([
            'message' => 'Your message has been sent successfully.',
        ], 201);
    }
}
