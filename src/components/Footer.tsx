"use client";
import { tinaField } from "tinacms/dist/react";

type Link = { label?: string | null; url?: string | null };
type Social = { platform?: string | null; url?: string | null };
type Globals = { site?: { name?: string | null; logo?: string | null } | null; footer?: { about?: string | null; links?: (Link | null)[] | null; copyright?: string | null } | null; contact?: { email?: string | null } | null; social?: (Social | null)[] | null };

export default function Footer({ globals }: { globals: Globals | null | undefined }) {
  const year = new Date().getFullYear();
  const f = globals?.footer;
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          {globals?.site?.logo && <img src={globals.site.logo} alt="" className="footer__logo" />}
          <strong className="footer__name">{globals?.site?.name}</strong>
          {f?.about && <p className="footer__about" data-tina-field={tinaField(f, "about")}>{f.about}</p>}
          <div className="footer__social">
            {(globals?.social ?? []).map((s, i) => s?.url && <a key={i} href={s.url} rel="noopener" target="_blank" data-tina-field={tinaField(s)}>{s.platform}</a>)}
          </div>
        </div>
        <nav className="footer__links" aria-label="Footer">
          {(f?.links ?? []).map((l, i) => l && <a key={i} href={l.url || "#"} data-tina-field={tinaField(l)}>{l.label}</a>)}
        </nav>
        <div className="footer__contact">
          {globals?.contact?.email && <a href={`mailto:${globals.contact.email}`}>{globals.contact.email}</a>}
        </div>
        <p className="footer__copy">&copy; {year} <span data-tina-field={f ? tinaField(f, "copyright") : undefined}>{f?.copyright || globals?.site?.name}</span></p>
      </div>
    </footer>
  );
}
