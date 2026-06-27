"use client";

import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import { useStore } from "zustand";
import { createRecentlyViewedStore, type RecentlyViewedStore, defaultInitState } from "./recently-viewed-store";

export type RecentlyViewedStoreApi = ReturnType<typeof createRecentlyViewedStore>;

const RecentlyViewedStoreContext = createContext<RecentlyViewedStoreApi | undefined>(undefined);

export const RecentlyViewedStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<RecentlyViewedStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createRecentlyViewedStore(defaultInitState);
  }
  useEffect(() => { storeRef.current?.persist.rehydrate(); }, []);
  return (
    <RecentlyViewedStoreContext.Provider value={storeRef.current}>
      {children}
    </RecentlyViewedStoreContext.Provider>
  );
};

export const useRecentlyViewedStore = <T,>(selector: (store: RecentlyViewedStore) => T): T => {
  const ctx = useContext(RecentlyViewedStoreContext);
  if (!ctx) {
    return selector(createRecentlyViewedStore(defaultInitState).getState());
  }
  return useStore(ctx, selector);
};

export const useRecentlyViewedItems = () => useRecentlyViewedStore((s) => s.items);
export const useHistoryIsOpen = () => useRecentlyViewedStore((s) => s.isOpen);
export const useRecentlyViewedCount = () => useRecentlyViewedStore((s) => s.items.length);
export const useRecentlyViewedActions = () => ({
  trackView: useRecentlyViewedStore((s) => s.trackView),
  clearHistory: useRecentlyViewedStore((s) => s.clearHistory),
  openHistory: useRecentlyViewedStore((s) => s.openHistory),
  closeHistory: useRecentlyViewedStore((s) => s.closeHistory),
});
