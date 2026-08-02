{{-- Call to Action Banner --}}
{{-- Expected variables: $heading, $body, $button_text, $button_link, $style (primary|secondary) --}}
<section class="cta-banner cta-banner--{{ $style ?? 'primary' }}">
    <div class="cta-banner__content">
        @if($heading)
            <h2 class="cta-banner__heading">{{ $heading }}</h2>
        @endif
        @if($body)
            <p class="cta-banner__body">{{ $body }}</p>
        @endif
        @if($button_text && $button_link)
            <a href="{{ $button_link }}" class="cta-banner__button cta-banner__button--{{ $style ?? 'primary' }}">
                {{ $button_text }}
            </a>
        @endif
    </div>
</section>
