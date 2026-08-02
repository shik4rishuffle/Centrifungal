@extends('layout')

@php
    use App\Services\StatamicValueHelper as V;

    $imageUrls = V::unwrapImages($images ?? null);
    $variantList = V::unwrap($sizes_variants ?? [], []);
    if (!is_array($variantList)) $variantList = [];

    $productName = V::unwrapString($name ?? null) ?: V::unwrapString($title ?? null, 'Product');
    $productPrice = (int) V::unwrap($price ?? 0, 0);
    $rawWeight = V::unwrap($weight_grams ?? null);
    $rawCategory = V::unwrapString($category ?? null);
    $rawInStock = V::unwrap($in_stock ?? true, true);
    $descHtml = V::bardToHtml($description ?? null);
@endphp

@section('content')
<main>
    <link rel="stylesheet" href="/preview-css/product.css">

    <nav class="product-breadcrumb" aria-label="Breadcrumb">
        <a href="/shop">Shop</a>
        <span aria-hidden="true">/</span>
        <span>{{ $productName }}</span>
    </nav>

    <section class="product-detail">
        <div class="product-detail__gallery">
            @if(count($imageUrls))
                @foreach($imageUrls as $i => $url)
                    <img src="{{ $url }}" alt="{{ $productName }}" loading="{{ $i === 0 ? 'eager' : 'lazy' }}" style="width: 100%; border-radius: var(--radius-lg); margin-bottom: var(--space-sm);">
                @endforeach
            @else
                <div style="aspect-ratio: 1; background: var(--neutral-100); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 4rem;">&#127812;</div>
            @endif
        </div>

        <div class="product-detail__info">
            @if($rawCategory)
                <span class="product-detail__category">{{ $rawCategory }}</span>
            @endif

            <h1 class="product-detail__title">{{ $productName }}</h1>

            <p class="product-detail__price">&pound;{{ number_format($productPrice / 100, 2) }}</p>

            @if($rawInStock)
                <span style="display: inline-block; padding: 4px 12px; border-radius: var(--radius-sm); background: var(--color-success-light, #e8f5e9); color: var(--color-success, #2e7d32); font-size: var(--text-sm); margin-bottom: var(--space-md);">In Stock</span>
            @else
                <span style="display: inline-block; padding: 4px 12px; border-radius: var(--radius-sm); background: var(--neutral-100); color: var(--neutral-500); font-size: var(--text-sm); margin-bottom: var(--space-md);">Out of Stock</span>
            @endif

            @if(count($variantList))
                <div style="margin-bottom: var(--space-md);">
                    <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-xs);">Sizes & Variants</p>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-xs);">
                        @foreach($variantList as $v)
                            @if(($v['type'] ?? null) === 'variant')
                                <span style="padding: 6px 14px; border: 1px solid var(--neutral-300); border-radius: var(--radius-sm); font-size: var(--text-sm);">
                                    {{ $v['variant_name'] ?? 'Variant' }}
                                    @if($v['price_override'] ?? null)
                                        - &pound;{{ number_format((int)$v['price_override'] / 100, 2) }}
                                    @endif
                                </span>
                            @endif
                        @endforeach
                    </div>
                </div>
            @endif

            @if($rawWeight)
                <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-md);">Weight: {{ $rawWeight }}g</p>
            @endif

            <button class="btn btn-primary btn-lg" style="width: 100%; pointer-events: none; opacity: 0.7;">Add to Cart (preview only)</button>

            @if($descHtml)
                <div class="product-detail__description" style="margin-top: var(--space-lg);">
                    {!! $descHtml !!}
                </div>
            @endif
        </div>
    </section>
</main>
@endsection
