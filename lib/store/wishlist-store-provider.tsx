"use client";

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import { useStore } from "zustand";
import { createWishlistStore, type WishlistStore, type WishlistState, defaultInitState } from "./wishlist-store";

export type WishlistStoreApi = ReturnType<typeof createWishlistStore>;

const WishlistStoreContext = createContext<WishlistStoreApi | undefined>(undefined);

export const WishlistStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<WishlistStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createWishlistStore(defaultInitState);
  }
  useEffect(() => { storeRef.current?.persist.rehydrate(); }, []);
  return (
    <WishlistStoreContext.Provider value={storeRef.current}>
      {children}
    </WishlistStoreContext.Provider>
  );
};

export const useWishlistStore = <T,>(selector: (store: WishlistStore) => T): T => {
  const ctx = useContext(WishlistStoreContext);
  if (!ctx) {
    return selector(createWishlistStore(defaultInitState).getState());
  }
  return useStore(ctx, selector);
};

export const useWishlistItems = () => useWishlistStore((s) => s.items);
export const useWishlistIsOpen = () => useWishlistStore((s) => s.isOpen);
export const useWishlistCount = () => useWishlistStore((s) => s.items.length);
export const useIsWishlisted = (productId: string) =>
  useWishlistStore((s) => s.items.some((i) => i.productId === productId));
export const useWishlistActions = () => ({
  toggleItem: useWishlistStore((s) => s.toggleItem),
  removeItem: useWishlistStore((s) => s.removeItem),
  clearWishlist: useWishlistStore((s) => s.clearWishlist),
  openWishlist: useWishlistStore((s) => s.openWishlist),
  closeWishlist: useWishlistStore((s) => s.closeWishlist),
});
