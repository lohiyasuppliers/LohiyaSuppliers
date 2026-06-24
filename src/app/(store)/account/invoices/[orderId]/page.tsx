import { redirect } from "next/navigation";

export default function InvoiceDetailRedirect() {
  redirect("/account/bills");
}
