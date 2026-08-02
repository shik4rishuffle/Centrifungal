@extends('statamic::layout')

@section('title', $title)

@section('content')

<div class="flex items-center justify-between mb-6">
    <h1>{{ $title }}</h1>
</div>

<div class="card p-0">
    @if($submissions->isEmpty())
        <div class="p-6 text-center text-grey-60">
            No contact submissions have been received yet.
        </div>
    @else
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Message</th>
                    <th>Submitted</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach($submissions as $submission)
                    <tr>
                        <td>{{ $submission->name }}</td>
                        <td class="text-sm">{{ $submission->email }}</td>
                        <td class="text-sm text-grey-70">{{ Str::limit($submission->message, 80) }}</td>
                        <td class="text-sm text-grey-70">{{ $submission->created_at->format('j M Y, H:i') }}</td>
                        <td>
                            <a href="{{ cp_route('contact-submissions.show', $submission->id) }}" class="text-blue hover:text-blue-dark">
                                View
                            </a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        @if($submissions->hasPages())
            <div class="p-4 border-t">
                {{ $submissions->links() }}
            </div>
        @endif
    @endif
</div>

@endsection
