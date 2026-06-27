import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
}

export interface WishlistState {
  items: WishlistItem[];
  isOpen: boolean;
}

export interface WishlistActions {
  toggleItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
}

export type WishlistStore = WishlistState & WishlistActions;

export const defaultInitState: WishlistState = {
  items: [],
  isOpen: false,
};

export const createWishlistStore = (initState: WishlistState = defaultInitState) =>
  createStore<WishlistStore>()(
    persist(
      (set) => ({
        ...initState,

        toggleItem: (item) =>
          set((state) => {
            const exists = state.items.some((i) => i.productId === item.productId);
            return {
              items: exists
                ? state.items.filter((i) => i.productId !== item.productId)
                : [...state.items, item],
            };
          }),

        removeItem: (productId) =>
          set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

        clearWishlist: () => set({ items: [] }),
        openWishlist: () => set({ isOpen: true }),
        closeWishlist: () => set({ isOpen: false }),
      }),
      {
        name: "wishlist-storage",
        skipHydration: true,
        partialize: (state) => ({ items: state.items }),
      }
    )
  );
