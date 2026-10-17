"use client";
import { useTina } from "tinacms/dist/react";
import { useScrollEffects } from "@skeleton-crew/blocks";
import Nav from "./Nav";
import Footer from "./Footer";

type TinaProps<T> = { data: T; query: string; variables: Record<string, unknown> };

/** Nav + footer around an app page (product, cart, confirmation) that is not a block page. */
export default function Shell({ globals, children }: { globals: TinaProps<any>; children: React.ReactNode }) {
  const { data: g } = useTina(globals);
  useScrollEffects(children);
  return (
    <>
      <Nav globals={g.globals} />
      <main id="main">{children}</main>
      <Footer globals={g.globals} />
    </>
  );
}
