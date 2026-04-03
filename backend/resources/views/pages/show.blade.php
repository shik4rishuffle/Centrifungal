@extends('layout')

@php
    use App\Services\StatamicValueHelper as V;
@endphp

@section('content')
<main>
    {{-- Homepage-specific layout --}}
    @if($hero_title ?? null)

        {{-- HERO --}}
        <section class="hero">
            <div class="hero__inner">
                <div class="hero__content">
                    @if($hero_eyebrow ?? null)
                        <span class="hero__eyebrow">{{ $hero_eyebrow }}</span>
                    @endif
                    <h1 class="hero__title">{{ $hero_title }}</h1>
                    @if($hero_text ?? null)
                        <p class="hero__text">{{ $hero_text }}</p>
                    @endif
                    <div class="hero__actions">
                        @if($hero_cta_primary_text ?? null)
                            <a href="{{ V::unwrapString($hero_cta_primary_link ?? null, '/shop') }}" class="btn btn-secondary btn-lg">{{ $hero_cta_primary_text }}</a>
                        @endif
                        @if($hero_cta_secondary_text ?? null)
                            <a href="{{ V::unwrapString($hero_cta_secondary_link ?? null, '#') }}" class="btn btn-outline btn-lg" style="border-color: rgba(255,255,255,0.3); color: var(--color-text-on-dark);">{{ $hero_cta_secondary_text }}</a>
                        @endif
                    </div>
                </div>
                <div class="hero__visual">
                    <div class="hero__image-placeholder" aria-label="Hero image">&#127812;</div>
                </div>
            </div>
        </section>

        {{-- FEATURED PRODUCTS --}}
        @if($featured_heading ?? null)
            <section class="section" aria-labelledby="featured-heading">
                <div class="container">
                    <div class="section__header">
                        <h2 class="section__title" id="featured-heading">{{ $featured_heading }}</h2>
                        @if($featured_subtitle ?? null)
                            <p class="section__subtitle">{{ $featured_subtitle }}</p>
                        @endif
                    </div>
                    <div class="products-grid">
                        <p style="color: var(--neutral-500); font-style: italic; grid-column: 1 / -1; text-align: center; padding: 40px 0;">Products load dynamically on the live site.</p>
                    </div>
                    <div class="section__cta">
                        <a href="/shop" class="btn btn-outline">View All Products</a>
                    </div>
                </div>
            </section>
        @endif

        {{-- BRAND STORY --}}
        @if($story_heading ?? null)
            <section class="section section--alt" aria-labelledby="story-heading">
                <div class="container">
                    <div class="brand-story">
                        @php
                            $img = V::resolveImageUrl($story_image ?? null);
                        @endphp
                        @if($img)
                            <img src="{{ $img }}" alt="{{ $story_heading }}" loading="lazy" style="width: 100%; border-radius: var(--radius-lg);">
                        @else
                            <div class="brand-story__image-placeholder" aria-label="Brand story image">&#127808;</div>
                        @endif
                        <div class="brand-story__content">
                            <h2 class="brand-story__title" id="story-heading">{{ $story_heading }}</h2>
                            @if($story_text ?? null)
                                @foreach(preg_split('/\n\n+/', $story_text) as $paragraph)
                                    <p class="brand-story__text">{{ trim($paragraph) }}</p>
                                @endforeach
                            @endif
                            @if($story_cta_text ?? null)
                                <a href="{{ V::unwrapString($story_cta_link ?? null, '/about') }}" class="btn btn-primary">{{ $story_cta_text }}</a>
                            @endif
                        </div>
                    </div>
                </div>
            </section>
        @endif

        {{-- USP CARDS --}}
        @if($usp_heading ?? null)
            <section class="section" aria-labelledby="how-heading">
                <div class="container">
                    <div class="section__header">
                        <h2 class="section__title" id="how-heading">{{ $usp_heading }}</h2>
                        @if($usp_subtitle ?? null)
                            <p class="section__subtitle">{{ $usp_subtitle }}</p>
                        @endif
                    </div>
                    @if($usp_cards ?? null)
                        <div class="how-it-works-grid">
                            @foreach($usp_cards as $card)
                                <article class="content-card">
                                    @if($card['icon'] ?? null)
                                        <div class="content-card__icon" aria-hidden="true">{{ $card['icon'] }}</div>
                                    @endif
                                    <h3 class="content-card__title">{{ $card['card_title'] ?? $card['title'] ?? '' }}</h3>
                                    <p class="content-card__text">{{ $card['card_text'] ?? $card['text'] ?? '' }}</p>
                                </article>
                            @endforeach
                        </div>
                    @endif
                </div>
            </section>
        @endif

        {{-- CTA BANNER --}}
        @if($cta_heading ?? null)
            <section class="cta-banner" aria-labelledby="cta-heading">
                <div class="cta-banner__inner">
                    <h2 class="cta-banner__title" id="cta-heading">{{ $cta_heading }}</h2>
                    @if($cta_text ?? null)
                        <p class="cta-banner__text">{{ $cta_text }}</p>
                    @endif
                    @if($cta_button_text ?? null)
                        <a href="{{ V::unwrapString($cta_button_link ?? null, '#') }}" class="btn btn-secondary btn-lg">{{ $cta_button_text }}</a>
                    @endif
                </div>
            </section>
        @endif

    @else
        {{-- Standard page layout (about, FAQ, etc.) --}}
        <section class="page-hero">
            <div class="container">
                <h1 class="page-hero__title">{{ $title ?? '' }}</h1>
                @if($subtitle ?? null)
                    <p class="page-hero__subtitle">{{ $subtitle }}</p>
                @endif
            </div>
        </section>

        @php
            $html = V::bardToHtml($page_content ?? null);
        @endphp
        @if($html)
            <div class="container">
                <div class="content-section">
                    {!! $html !!}
                </div>
            </div>
        @endif
    @endif
</main>
@endsection
