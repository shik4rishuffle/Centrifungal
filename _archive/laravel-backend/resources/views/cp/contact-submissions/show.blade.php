@extends('statamic::layout')

@section('title', $title)

@section('content')

<div class="mb-6">
    <a href="{{ cp_route('contact-submissions.index') }}" class="text-blue hover:text-blue-dark text-sm">&larr; Back to Contact Submissions</a>
</div>

<div class="flex items-center justify-between mb-6">
    <h1>{{ $title }}</h1>
</div>

<div class="flex flex-wrap -mx-2">
    {{-- Contact details --}}
    <div class="w-1/2 px-2 mb-4">
        <div class="card p-4">
            <h2 class="font-bold text-lg mb-4">Contact Details</h2>
            <dl class="space-y-2">
                <div>
                    <dt class="text-grey-60 text-sm">Name</dt>
                    <dd>{{ $submission->name }}</dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">Email</dt>
                    <dd>
                        <a href="mailto:{{ $submission->email }}" class="text-blue hover:text-blue-dark">
                            {{ $submission->email }}
                        </a>
                    </dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">IP Address</dt>
                    <dd class="font-mono text-sm">{{ $submission->ip_address ?? '-' }}</dd>
                </div>
                <div>
                    <dt class="text-grey-60 text-sm">Submitted</dt>
                    <dd>{{ $submission->created_at->format('j M Y, H:i') }}</dd>
                </div>
            </dl>
        </div>
    </div>

    {{-- Message --}}
    <div class="w-1/2 px-2 mb-4">
        <div class="card p-4">
            <h2 class="font-bold text-lg mb-4">Message</h2>
            <div class="prose max-w-none">
                {!! nl2br(e($submission->message)) !!}
            </div>
        </div>
    </div>
</div>

@endsection
