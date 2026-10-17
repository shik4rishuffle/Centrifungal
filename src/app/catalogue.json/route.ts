import { loadCategories, loadProducts } from "@/lib/data";

// Published with the static export at /catalogue.json. The backend re-prices checkout from this
// instead of a CMS API: the same git content, same build, no second source of truth.
export const dynamic = "force-static";

export async function GET() {
  const [products, categories] = await Promise.all([loadProducts(), loadCategories()]);
  const body = {
    generatedAt: new Date().toISOString(),
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, sortOrder: c.sortOrder ?? null })),
    products: products.map((p: any) => ({
      slug: p.slug, name: p.name, sku: p.sku ?? null, pricePence: p.pricePence, inStock: p.inStock !== false, featured: !!p.featured,
      weightGrams: p.weightGrams ?? 0, category: typeof p.category === "string" ? p.category.split("/").pop()?.replace(/\.json$/, "") : null,
      variants: (p.variants ?? []).map((v: any) => ({ name: v.name, sku: v.sku, pricePence: v.pricePence ?? p.pricePence, inStock: v.inStock !== false })),
    })),
  };
  return Response.json(body);
}
