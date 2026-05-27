"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, type DeliveryInfo } from "@/lib/actions/checkout";
import { useCartItems } from "@/lib/store/cart-store-provider";

interface CheckoutButtonProps {
  disabled?: boolean;
  delivery: DeliveryInfo;
}

export function CheckoutButton({ disabled, delivery }: CheckoutButtonProps) {
  const items = useCartItems();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(
        items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        delivery
      );

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <div>
      <Button
        onClick={handleCheckout}
        disabled={disabled || isPending || items.length === 0}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Proceed to Payment"
        )}
      </Button>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
