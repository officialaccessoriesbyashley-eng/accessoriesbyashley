"use client";

import { useRouter } from "next/navigation";
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

  if (stock <= 0) return null;

  const handleBuyNow = () => {
    addItem({ productId, name, price, image }, 1);
    router.push("/checkout");
  };

  return (
    <Button
      variant="outline"
      onClick={handleBuyNow}
      className={cn("h-11 w-full", className)}
    >
      Buy Now
    </Button>
  );
}
