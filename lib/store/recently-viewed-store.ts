import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 20;

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  viewedAt: number;
}

export interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  isOpen: boolean;
}

export interface RecentlyViewedActions {
  trackView: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clearHistory: () => void;
  openHistory: () => void;
  closeHistory: () => void;
}

export type RecentlyViewedStore = RecentlyViewedState & RecentlyViewedActions;

export const defaultInitState: RecentlyViewedState = {
  items: [],
  isOpen: false,
};

export const createRecentlyViewedStore = (initState: RecentlyViewedState = defaultInitState) =>
  createStore<RecentlyViewedStore>()(
    persist(
      (set) => ({
        ...initState,

        trackView: (item) =>
          set((state) => {
            const filtered = state.items.filter((i) => i.productId !== item.productId);
            const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
            return { items: updated };
          }),

        clearHistory: () => set({ items: [] }),
        openHistory: () => set({ isOpen: true }),
        closeHistory: () => set({ isOpen: false }),
      }),
      {
        name: "recently-viewed-storage",
        skipHydration: true,
        partialize: (state) => ({ items: state.items }),
      }
    )
  );
