"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Heart, ShoppingCart, Menu, Sparkles } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";
import { useTotalItems, useCartActions } from "@/lib/store/cart-store-provider";
import { useWishlistCount, useWishlistActions } from "@/lib/store/wishlist-store-provider";
import { useRecentlyViewedCount, useRecentlyViewedActions } from "@/lib/store/recently-viewed-store-provider";
import { useChatActions, useIsChatOpen } from "@/lib/store/chat-store-provider";
import { MobileDrawer } from "@/components/app/MobileDrawer";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.query-types";
import { cn } from "@/lib/utils";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["600"], display: "swap" });

interface MobileHeaderProps {
  categories: ALL_CATEGORIES_QUERYResult;
}

export function MobileHeader({ categories }: MobileHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openCart } = useCartActions();
  const { openWishlist } = useWishlistActions();
  const { openHistory } = useRecentlyViewedActions();
  const { openChat } = useChatActions();
  const isChatOpen = useIsChatOpen();

  const cartCount = useTotalItems();
  const wishlistCount = useWishlistCount();
  const historyCount = useRecentlyViewedCount();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className={`${cormorant.className} text-[10px] font-semibold tracking-widest text-zinc-900 dark:text-zinc-100`}>
              ACCESSORIES BY ASHLEY
            </span>
          </Link>

          {/* Icon row */}
          <div className="flex items-center gap-0.5">
            {/* AI button */}
            {!isChatOpen && (
              <NavIconButton
                onClick={openChat}
                label="Ask Ashley AI"
                className="text-amber-500"
              >
                <Sparkles className="h-[18px] w-[18px]" />
              </NavIconButton>
            )}

            {/* History */}
            <NavIconButton onClick={openHistory} label="Recently viewed" badge={historyCount}>
              <Clock className="h-[18px] w-[18px]" />
            </NavIconButton>

            {/* Wishlist */}
            <NavIconButton onClick={openWishlist} label="Wishlist" badge={wishlistCount}>
              <Heart className="h-[18px] w-[18px]" />
            </NavIconButton>

            {/* Cart */}
            <NavIconButton onClick={openCart} label="Cart" badge={cartCount}>
              <ShoppingCart className="h-[18px] w-[18px]" />
            </NavIconButton>

            {/* Menu */}
            <NavIconButton onClick={() => setDrawerOpen(true)} label="Menu">
              <Menu className="h-[18px] w-[18px]" />
            </NavIconButton>
          </div>
        </div>
      </header>

      <MobileDrawer
        categories={categories}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

function NavIconButton({
  children,
  onClick,
  href,
  label,
  badge,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  label: string;
  badge?: number;
  className?: string;
}) {
  const inner = (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
      <span className={cn(className)}>{children}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );

  if (href) {
    return <Link href={href} aria-label={label}>{inner}</Link>;
  }
  return (
    <button type="button" onClick={onClick} aria-label={label}>
      {inner}
    </button>
  );
}
