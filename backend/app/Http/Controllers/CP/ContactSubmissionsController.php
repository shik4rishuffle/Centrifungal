<?php

namespace App\Http\Controllers\CP;

use App\Models\ContactSubmission;
use Illuminate\Routing\Controller;
use Statamic\Http\Middleware\CP\Authenticate;

class ContactSubmissionsController extends Controller
{
    public function __construct()
    {
        $this->middleware(Authenticate::class);
    }

    /**
     * Show a read-only paginated listing of contact form submissions.
     */
    public function index()
    {
        $submissions = ContactSubmission::query()
            ->orderByDesc('created_at')
            ->paginate(25);

        return view('cp.contact-submissions.index', [
            'submissions' => $submissions,
            'title' => 'Contact Submissions',
        ]);
    }

    /**
     * Show a single contact submission's details (read-only).
     */
    public function show(ContactSubmission $submission)
    {
        return view('cp.contact-submissions.show', [
            'submission' => $submission,
            'title' => 'Submission from ' . $submission->name,
        ]);
    }
}
