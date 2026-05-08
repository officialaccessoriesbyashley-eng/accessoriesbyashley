import { redirect } from "next/navigation";
import { SuccessClient } from "./SuccessClient";
import { verifyPaystackPayment } from "@/lib/actions/checkout";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Confirmed | Accessories by Ashley",
  description: "Your order has been placed successfully",
};

interface SuccessPageProps {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  if (!reference) {
    redirect("/");
  }

  const result = await verifyPaystackPayment(reference);

  if (!result.success || !result.session) {
    redirect("/");
  }

  return <SuccessClient session={result.session} />;
}
