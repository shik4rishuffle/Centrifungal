{{-- Text Block --}}
{{-- Expected variables: $body (rich text HTML) --}}
<div class="text-block">
    @if($body)
        <div class="text-block__body prose">
            {!! $body !!}
        </div>
    @endif
</div>
