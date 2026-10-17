"use client";
import { useState } from "react";
import { formatPrice } from "@skeleton-crew/blocks";
import { removeFromCart, setQuantity, useCart } from "@/lib/cart";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const FREE_SHIPPING_PENCE = 5000;

export default function CartPage() {
  const { items, subtotalPence } = useCart();
  const [status, setStatus] = useState<{ state: "idle" | "busy" | "error"; text: string }>({ state: "idle", text: "" });

  async function checkout() {
    setStatus({ state: "busy", text: "Taking you to secure checkout..." });
    try {
      const res = await fetch(`${API_BASE}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((i) => ({ slug: i.slug, sku: i.sku, quantity: i.quantity })) }) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) throw new Error("Some items are no longer available. Please review your cart.");
      if (!res.ok || !json.sessionUrl) throw new Error(json.error || "Checkout is unavailable right now.");
      window.location.href = json.sessionUrl;
    } catch (err) {
      setStatus({ state: "error", text: (err as Error).message });
    }
  }

  return (
    <section className="cart section">
      <div className="container cart__inner">
        <h1 className="heading heading--lg">Your cart</h1>
        {items.length === 0 ? (
          <p className="cart__empty">Your cart is empty. <a href="/shop">Browse the shop</a>.</p>
        ) : (
          <div className="cart__grid">
            <ul className="cart__list">
              {items.map((i) => (
                <li key={`${i.slug}-${i.sku}`} className="cart__item">
                  {i.image ? <img src={i.image} alt="" className="cart__thumb" /> : <div className="cart__thumb cart__thumb--empty" aria-hidden="true" />}
                  <div className="cart__detail">
                    <a href={`/product/${i.slug}`} className="cart__name">{i.name}</a>
                    {i.variantName && <span className="cart__variant">{i.variantName}</span>}
                    <span className="cart__unit">{formatPrice(i.pricePence)} each</span>
                  </div>
                  <label className="cart__qty">Qty<input type="number" min={0} max={20} value={i.quantity} onChange={(e) => setQuantity(i.slug, i.sku, Number(e.target.value) || 0)} /></label>
                  <span className="cart__line">{formatPrice(i.pricePence * i.quantity)}</span>
                  <button type="button" className="cart__remove" onClick={() => removeFromCart(i.slug, i.sku)} aria-label={`Remove ${i.name}`}>Remove</button>
                </li>
              ))}
            </ul>
            <aside className="cart__summary">
              <h2 className="cart__summary-title">Summary</h2>
              <p className="cart__row"><span>Subtotal</span><span>{formatPrice(subtotalPence)}</span></p>
              <p className="cart__row cart__row--muted"><span>Shipping</span><span>{subtotalPence >= FREE_SHIPPING_PENCE ? "Free" : "Calculated at checkout"}</span></p>
              <button type="button" className="btn btn--primary cart__checkout" onClick={checkout} disabled={status.state === "busy"}>Checkout</button>
              <p className="cart__status" role="status" data-state={status.state}>{status.text}</p>
              <p className="cart__note">Secure payment by Stripe. UK delivery only.</p>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
