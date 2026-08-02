{{-- Image block --}}
{{-- Expected variables: $image, $alt_text, $caption --}}
<figure class="image-block">
    @if($image)
        <img src="{{ $image }}" alt="{{ $alt_text ?? '' }}" class="image-block__img" loading="lazy">
    @endif
    @if($caption)
        <figcaption class="image-block__caption">{{ $caption }}</figcaption>
    @endif
</figure>
