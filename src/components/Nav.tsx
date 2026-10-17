"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { tinaField } from "tinacms/dist/react";
import { useCart } from "@/lib/cart";

type Link = { label?: string | null; url?: string | null; variant?: string | null };
type Globals = { site?: { name?: string | null; logo?: string | null } | null; nav?: { links?: (Link | null)[] | null; cta?: Link | null } | null };

export default function Nav({ globals }: { globals: Globals | null | undefined }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();
  const name = globals?.site?.name || "Centrifungal";
  const links = (globals?.nav?.links ?? []).filter((l): l is Link => !!l);
  const isCurrent = (url?: string | null) => !!url && url !== "/" && pathname.startsWith(url);
  return (
    <header className="nav">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container nav__inner">
        <a href="/" className="nav__brand" aria-label={`${name} home`}>
          {globals?.site?.logo && <img src={globals.site.logo} alt="" className="nav__logo" />}
          <span className="nav__name" data-tina-field={globals?.site ? tinaField(globals.site, "name") : undefined}>{name}</span>
        </a>
        <nav className={`nav__links${open ? " is-open" : ""}`} id="nav-links" aria-label="Main">
          {links.map((l, i) => <a key={i} href={l.url || "#"} className="nav__link" aria-current={isCurrent(l.url) ? "page" : undefined} data-tina-field={tinaField(l)} onClick={() => setOpen(false)}>{l.label}</a>)}
        </nav>
        <div className="nav__actions">
          <a href="/cart" className="nav__cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M6 6L5 3H2" /></svg>
            {count > 0 && <span className="nav__badge">{count}</span>}
          </a>
          <button className="nav__burger" type="button" aria-expanded={open} aria-controls="nav-links" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
