import type { Metadata } from "next";
import SitePage from "@/components/SitePage";
import { listPages, loadCategories, loadGlobals, loadPage, loadProducts } from "@/lib/data";

export async function generateStaticParams() {
  const slugs = await listPages();
  return slugs.filter((s) => s !== "home").map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  const seo = page.data.page.seo;
  return { title: seo?.metaTitle ? { absolute: seo.metaTitle } : page.data.page.title, description: seo?.metaDescription || undefined };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, globals, products, categories] = await Promise.all([loadPage(slug), loadGlobals(), loadProducts(), loadCategories()]);
  return <SitePage page={page} globals={globals} products={products} categories={categories} />;
}
