{{-- Image + Text block --}}
{{-- Expected variables: $image, $alt_text, $body (rich text HTML), $image_position (left|right) --}}
<div class="image-text image-text--{{ $image_position ?? 'left' }}">
    <div class="image-text__image">
        @if($image)
            <img src="{{ $image }}" alt="{{ $alt_text ?? '' }}" loading="lazy">
        @endif
    </div>
    <div class="image-text__body prose">
        @if($body)
            {!! $body !!}
        @endif
    </div>
</div>
