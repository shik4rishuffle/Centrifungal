import Shell from "@/components/Shell";
import { loadGlobals } from "@/lib/data";

export default async function NotFound() {
  const globals = await loadGlobals();
  return (
    <Shell globals={globals}>
      <section className="section"><div className="container" style={{ textAlign: "center" }}>
        <h1 className="heading heading--lg">Nothing growing here</h1>
        <p className="lead" style={{ margin: "12px auto 24px" }}>That page does not exist. Try the shop instead.</p>
        <a className="btn btn--primary" href="/shop">Go to the shop</a>
      </div></section>
    </Shell>
  );
}
