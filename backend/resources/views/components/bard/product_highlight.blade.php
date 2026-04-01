{{-- Product Highlight block --}}
{{-- Expected variables: $products (collection of product entries, max 4) --}}
<section class="product-highlight">
    @if($products)
        <div class="product-highlight__grid">
            @foreach($products as $product)
                <div class="product-highlight__item">
                    {{-- Product card markup - to be refined by frontend agent --}}
                    <h3 class="product-highlight__name">{{ $product->name ?? '' }}</h3>
                </div>
            @endforeach
        </div>
    @endif
</section>
