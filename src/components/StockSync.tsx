"use client";
import { useEffect } from "react";
import { useSoldOut } from "@/lib/stock";

/**
 * Marks product cards whose every sellable line is sold out since the last build. Cards carry
 * data-product=<slug> from the library; variant SKUs are not on the card, so a product is
 * treated as sold out when the ledger lists it under every sku we know, or under the product's
 * own sku. Good enough for a badge; the product page does the exact per-variant check.
 */
export default function StockSync({ products }: { products: { slug: string; sku?: string | null; variants?: ({ sku?: string | null } | null)[] | null }[] }) {
  const soldOut = useSoldOut();
  useEffect(() => {
    if (soldOut.length === 0) return;
    for (const p of products) {
      const skus = (p.variants ?? []).map((v) => v?.sku).filter((s): s is string => !!s);
      const lines = skus.length ? skus : [p.sku || p.slug];
      const allOut = lines.every((sku) => soldOut.some((i) => i.slug === p.slug && i.sku === sku));
      if (!allOut) continue;
      document.querySelectorAll<HTMLElement>(`[data-product="${p.slug}"]`).forEach((card) => {
        card.classList.add("product-card--unavailable");
        if (!card.querySelector(".product-card__badge--sold-out")) {
          const media = card.querySelector(".product-card__media");
          const badge = document.createElement("span");
          badge.className = "product-card__badge product-card__badge--sold-out";
          badge.textContent = "Sold out";
          media?.appendChild(badge);
        }
      });
    }
  }, [soldOut, products]);
  return null;
}
