"use client";
import { useEffect, useState } from "react";
import { clearCart } from "@/lib/cart";

export default function OrderConfirmation() {
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (id) { setRef(id); clearCart(); }
  }, []);
  return (
    <section className="confirm section">
      <div className="container confirm__inner" data-reveal>
        <div className="confirm__mark" aria-hidden="true">✓</div>
        <h1 className="heading heading--lg">Thank you for your order</h1>
        <p className="lead">We have emailed your confirmation. Your log will be dispatched within 48 hours in plastic-free packaging.</p>
        {ref && <p className="confirm__ref">Reference <code>{ref}</code></p>}
        <div className="confirm__actions"><a className="btn btn--primary" href="/care-instructions">Read the care guide</a><a className="btn btn--outline" href="/shop">Keep shopping</a></div>
      </div>
    </section>
  );
}
