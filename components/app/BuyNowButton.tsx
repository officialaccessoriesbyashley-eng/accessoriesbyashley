"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartActions } from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";

interface BuyNowButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  className?: string;
}

export function BuyNowButton({ productId, name, price, image, stock, className }: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem } = useCartActions();
  const [isPending, startTransition] = useTransition();

  if (stock <= 0) return null;

  const handleBuyNow = () => {
    addItem({ productId, name, price, image }, 1);
    startTransition(() => {
      router.push("/checkout");
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleBuyNow}
      disabled={isPending}
      className={cn("h-11 w-full", className)}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Buy Now
    </Button>
  );
}
