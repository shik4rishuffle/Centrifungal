import Shell from "@/components/Shell";
import OrderConfirmation from "@/components/OrderConfirmation";
import { loadGlobals } from "@/lib/data";

export const metadata = { title: "Order confirmed", robots: { index: false } };
export default async function Confirmed() {
  const globals = await loadGlobals();
  return <Shell globals={globals}><OrderConfirmation /></Shell>;
}
