{{-- Hero Banner block --}}
{{-- Expected variables: $heading, $subheading, $background_image, $cta_text, $cta_link --}}
<section class="hero" @if($background_image) style="background-image: url('{{ $background_image }}')" @endif>
    <div class="hero__content">
        @if($heading)
            <h1 class="hero__heading">{{ $heading }}</h1>
        @endif
        @if($subheading)
            <p class="hero__subheading">{{ $subheading }}</p>
        @endif
        @if($cta_text && $cta_link)
            <a href="{{ $cta_link }}" class="hero__cta">{{ $cta_text }}</a>
        @endif
    </div>
</section>
