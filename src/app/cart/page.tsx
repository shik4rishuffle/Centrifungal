import Shell from "@/components/Shell";
import CartPage from "@/components/CartPage";
import { loadGlobals } from "@/lib/data";

export const metadata = { title: "Cart", robots: { index: false } };
export default async function Cart() {
  const globals = await loadGlobals();
  return <Shell globals={globals}><CartPage /></Shell>;
}
