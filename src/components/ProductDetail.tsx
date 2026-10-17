"use client";
import { useMemo, useState } from "react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { formatPrice, categoryNameOf, type Product, type ProductVariant } from "@skeleton-crew/blocks";
import { addToCart } from "@/lib/cart";

type Props = { product: Product & { description?: any }; categories: { slug: string; name: string }[] };

export default function ProductDetail({ product, categories }: Props) {
  const variants = useMemo(() => (product.variants ?? []).filter((v): v is ProductVariant => !!v), [product.variants]);
  const [sku, setSku] = useState<string>(variants.find((v) => v.inStock !== false)?.sku || variants[0]?.sku || product.sku || product.slug);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.sku === sku);
  const price = variant?.pricePence ?? product.pricePence;
  const available = product.inStock !== false && (variants.length === 0 || variant?.inStock !== false);
  const images = (product.images ?? []).filter(Boolean) as { image?: string | null; alt?: string | null }[];
  const [current, setCurrent] = useState(0);
  const category = categoryNameOf(product, categories as never);

  function add() {
    addToCart({ slug: product.slug, sku, name: product.name, variantName: variant?.name ?? null, pricePence: price, image: images[0]?.image ?? null }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <section className="product section">
      <div className="container product__inner">
        <nav className="product__crumbs" aria-label="Breadcrumb"><a href="/shop">Shop</a>{category && <><span aria-hidden="true">/</span><span>{category}</span></>}</nav>
        <div className="product__grid">
          <div className="product__gallery" data-reveal>
            {images[current]?.image ? <img className="product__image" src={images[current].image!} alt={images[current].alt || product.name} /> : <div className="product__image product__image--empty" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div>}
            {images.length > 1 && (
              <div className="product__thumbs">
                {images.map((im, i) => <button key={i} type="button" className={i === current ? "is-active" : ""} onClick={() => setCurrent(i)} aria-label={`Image ${i + 1}`}><img src={im.image!} alt="" /></button>)}
              </div>
            )}
          </div>
          <div className="product__info" data-reveal>
            {category && <span className="product__category">{category}</span>}
            <h1 className="product__title">{product.name}</h1>
            <p className="product__price">{formatPrice(price)}</p>
            {!available && <p className="product__status">Sold out</p>}
            {variants.length > 0 && (
              <fieldset className="product__variants">
                <legend>Options</legend>
                {variants.map((v) => (
                  <label key={v.sku!} className={`product__variant${v.sku === sku ? " is-selected" : ""}${v.inStock === false ? " is-out" : ""}`}>
                    <input type="radio" name="variant" value={v.sku!} checked={v.sku === sku} onChange={() => setSku(v.sku!)} disabled={v.inStock === false} />
                    <span>{v.name}</span><span className="product__variant-price">{formatPrice(v.pricePence ?? product.pricePence)}</span>{v.inStock === false && <span className="product__variant-out">Sold out</span>}
                  </label>
                ))}
              </fieldset>
            )}
            <div className="product__buy">
              <label className="product__qty">Qty
                <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
              </label>
              <button type="button" className="btn btn--primary" onClick={add} disabled={!available}>{added ? "Added to cart" : available ? "Add to cart" : "Sold out"}</button>
              {added && <a className="product__go-cart" href="/cart">View cart</a>}
            </div>
            {product.description && <div className="prose product__desc"><TinaMarkdown content={product.description} /></div>}
            {product.weightGrams ? <p className="product__meta">Shipping weight {product.weightGrams >= 1000 ? `${product.weightGrams / 1000}kg` : `${product.weightGrams}g`}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
