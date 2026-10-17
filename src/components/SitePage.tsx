"use client";
import { useTina } from "tinacms/dist/react";
import { Blocks, pick, useScrollEffects } from "@skeleton-crew/blocks";
import { blockNames } from "../../site.blocks";
import Nav from "./Nav";
import Footer from "./Footer";

const site = pick(blockNames);
type TinaProps<T> = { data: T; query: string; variables: Record<string, unknown> };
export const PRODUCT_PATH = "/product";

export default function SitePage({ page, globals, products = [], categories = [] }: { page: TinaProps<any>; globals: TinaProps<any>; products?: any[]; categories?: any[] }) {
  const { data } = useTina(page);
  const { data: g } = useTina(globals);
  useScrollEffects(data);
  return (
    <>
      <Nav globals={g.globals} />
      <main id="main">
        <Blocks blocks={data.page.blocks} components={site.components} context={{ globals: g.globals, products, categories, productPathPrefix: PRODUCT_PATH }} />
      </main>
      <Footer globals={g.globals} />
    </>
  );
}
