import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import ProductDetail from "@/components/ProductDetail";
import { listProductSlugs, loadCategories, loadGlobals, loadProducts } from "@/lib/data";

export async function generateStaticParams() {
  return (await listProductSlugs()).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await loadProducts()).find((p) => p.slug === slug);
  return { title: product?.name || "Product", description: (product as any)?.shortDescription || undefined };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [globals, products, categories] = await Promise.all([loadGlobals(), loadProducts(), loadCategories()]);
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <Shell globals={globals}>
      <ProductDetail product={product as any} categories={categories as any} />
    </Shell>
  );
}
