import { client } from "../../tina/__generated__/client";
import { PageDocument, GlobalsDocument } from "../../tina/__generated__/types";
import { loadDocument, listDocuments, listCollection, parsePageRichText, parseRichTextBySchema } from "@skeleton-crew/blocks/server";
import { pickTemplates } from "@skeleton-crew/blocks/templates";
import { blockNames } from "../../site.blocks";

const templates = pickTemplates(blockNames);

export async function loadPage(slug: string) {
  const relativePath = `${slug}.json`;
  return loadDocument(() => client.queries.page({ relativePath }), {
    key: "page", collectionPath: "content/pages", relativePath, query: PageDocument, variables: { relativePath },
    transform: (raw) => parsePageRichText(raw, templates),
  });
}
export async function loadGlobals() {
  const relativePath = "site.json";
  return loadDocument(() => client.queries.globals({ relativePath }), {
    key: "globals", collectionPath: "content/globals", relativePath, query: GlobalsDocument, variables: { relativePath },
  });
}
export const listPages = () => listDocuments("content/pages");
export const loadCategories = () => listCollection<{ name: string; description?: string; sortOrder?: number }>("content/categories");
export async function loadProducts() {
  const products = await listCollection<{ name: string; pricePence: number; description?: unknown }>("content/products");
  // description is rich text (markdown in JSON); parse it for the product page
  return Promise.all(products.map((p) => parseRichTextBySchema(p, [{ type: "rich-text", name: "description" }])));
}
export const listProductSlugs = () => listDocuments("content/products");
