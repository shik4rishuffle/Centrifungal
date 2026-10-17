"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
export type SoldOut = { slug: string; sku: string };

let cache: { at: number; data: SoldOut[] } | null = null;

/** Sold-out lines since the last build, from the backend ledger. Fails quietly to an empty list. */
export function useSoldOut(): SoldOut[] {
  const [list, setList] = useState<SoldOut[]>(cache?.data ?? []);
  useEffect(() => {
    let cancelled = false;
    if (cache && Date.now() - cache.at < 30_000) { setList(cache.data); return; }
    fetch(`${API_BASE}/api/stock`, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : { soldOut: [] }))
      .then((j) => { const data = Array.isArray(j.soldOut) ? j.soldOut : []; cache = { at: Date.now(), data }; if (!cancelled) setList(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return list;
}

export const isLineSoldOut = (list: SoldOut[], slug: string, sku: string) => list.some((i) => i.slug === slug && i.sku === sku);
