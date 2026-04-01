{{-- FAQ Group block --}}
{{-- Expected variables: $items (replicator array of question/answer pairs) --}}
<section class="faq-group">
    @if($items)
        <dl class="faq-group__list">
            @foreach($items as $item)
                <div class="faq-group__item">
                    <dt class="faq-group__question">{{ $item['question'] ?? '' }}</dt>
                    <dd class="faq-group__answer">{{ $item['answer'] ?? '' }}</dd>
                </div>
            @endforeach
        </dl>
    @endif
</section>
