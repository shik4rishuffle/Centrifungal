import type { Metadata } from "next";
import SitePage from "@/components/SitePage";
import { loadCategories, loadGlobals, loadPage, loadProducts } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPage("home");
  const seo = page.data.page.seo;
  return { title: { absolute: seo?.metaTitle || "Centrifungal - Premium Mushroom Grow Logs" }, description: seo?.metaDescription || undefined };
}
export default async function Home() {
  const [page, globals, products, categories] = await Promise.all([loadPage("home"), loadGlobals(), loadProducts(), loadCategories()]);
  return <SitePage page={page} globals={globals} products={products} categories={categories} />;
}
