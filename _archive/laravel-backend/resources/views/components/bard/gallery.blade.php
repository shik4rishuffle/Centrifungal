{{-- Gallery block --}}
{{-- Expected variables: $images (array of asset URLs, max 12), $columns (2|3|4) --}}
<section class="gallery gallery--cols-{{ $columns ?? '3' }}">
    @if($images)
        <div class="gallery__grid">
            @foreach($images as $image)
                <div class="gallery__item">
                    <img src="{{ $image }}" alt="" loading="lazy" class="gallery__img">
                </div>
            @endforeach
        </div>
    @endif
</section>
