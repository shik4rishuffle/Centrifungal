"use client";
import { useSyncExternalStore } from "react";

// Client-side cart in localStorage, same key and item shape as the previous frontend so the
// backend checkout contract ({ items: [{ slug, sku, quantity }] }) is unchanged.
export const CART_KEY = "centrifungal_cart";
const EVENT = "centrifungal-cart-change";

export type CartItem = { slug: string; sku: string; name: string; variantName?: string | null; pricePence: number; quantity: number; image?: string | null };

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
let cache: CartItem[] | null = null;
let cacheRaw = "";
function snapshot(): CartItem[] {
  const raw = typeof window === "undefined" ? "" : localStorage.getItem(CART_KEY) || "";
  if (raw !== cacheRaw || cache === null) { cacheRaw = raw; cache = read(); }
  return cache;
}
function write(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}
const EMPTY: CartItem[] = [];
export function useCart() {
  const items = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotalPence = items.reduce((n, i) => n + i.pricePence * i.quantity, 0);
  return { items, count, subtotalPence };
}
export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = read();
  const existing = items.find((i) => i.slug === item.slug && i.sku === item.sku);
  if (existing) existing.quantity += quantity; else items.push({ ...item, quantity });
  write(items);
}
export function setQuantity(slug: string, sku: string, quantity: number) {
  const items = read().map((i) => (i.slug === slug && i.sku === sku ? { ...i, quantity } : i)).filter((i) => i.quantity > 0);
  write(items);
}
export function removeFromCart(slug: string, sku: string) { write(read().filter((i) => !(i.slug === slug && i.sku === sku))); }
export function clearCart() { write([]); }
