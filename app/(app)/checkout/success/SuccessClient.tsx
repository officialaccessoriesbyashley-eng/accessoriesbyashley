"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartActions } from "@/lib/store/cart-store-provider";

interface SuccessSession {
  id: string;
  customerEmail?: string | null;
  customerName?: string | null;
  amountTotal?: number | null;
  paymentStatus: string;
  deliveryMethod?: string;
  deliveryFee?: number;
  orderNumber?: string;
}

interface SuccessClientProps {
  session: SuccessSession;
  isPod?: boolean;
}

export function SuccessClient({ session, isPod = false }: SuccessClientProps) {
  const { clearCart } = useCartActions();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const isPickup = session.deliveryMethod === "pickup";
  const isPodPayment = isPod || session.paymentStatus === "pay-on-delivery";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Order Confirmed!
        </h1>
        {session.customerEmail && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Thank you{session.customerName ? `, ${session.customerName}` : ""}!
            We&apos;ve received your order.
          </p>
        )}
      </div>

      <div className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Order number */}
        {session.orderNumber && (
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Order number
            </p>
            <p className="mt-1 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {session.orderNumber}
            </p>
          </div>
        )}

        {/* Payment */}
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {isPodPayment
                  ? isPickup
                    ? "Pay at pickup"
                    : "Pay on delivery"
                  : "Payment received"}
              </p>
              {session.amountTotal && !isPodPayment && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatPrice(session.amountTotal / 100)} paid
                </p>
              )}
              {isPodPayment && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Pay with cash or M-Pesa when your order{" "}
                  {isPickup ? "is collected" : "arrives"}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-2">
            {isPickup ? (
              <Store className="mt-0.5 h-5 w-5 text-zinc-400" />
            ) : (
              <Truck className="mt-0.5 h-5 w-5 text-zinc-400" />
            )}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {isPickup ? "Ready for pickup" : "Out for delivery"}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {isPickup
                  ? "Your order will be ready within 2 hours. We'll WhatsApp you when it's ready."
                  : "We'll WhatsApp you with tracking updates."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/orders">
            View Your Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
