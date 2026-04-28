"use client";

import { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import type { CartItem } from "@/lib/store/cart-store";

interface StockInfo {
  currentStock: number;
  isOutOfStock: boolean;
  exceedsStock: boolean;
}

interface UseCartStockReturn {
  stockMap: Map<string, StockInfo>;
  isLoading: boolean;
  hasStockIssues: boolean;
}

export function useCartStock(items: CartItem[]): UseCartStockReturn {
  const [stockMap, setStockMap] = useState<Map<string, StockInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setStockMap(new Map());
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStock() {
      setIsLoading(true);
      try {
        const ids = items.map((item) => item.productId);
        const products: Array<{ _id: string; stock: number | null }> =
          await client.fetch(PRODUCTS_BY_IDS_QUERY, { ids });

        if (cancelled) return;

        const map = new Map<string, StockInfo>();
        for (const item of items) {
          const product = products.find((p) => p._id === item.productId);
          const currentStock = product?.stock ?? 0;
          map.set(item.productId, {
            currentStock,
            isOutOfStock: currentStock === 0,
            exceedsStock: item.quantity > currentStock,
          });
        }
        setStockMap(map);
      } catch {
        // On error, don't block checkout — assume stock is fine
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStock();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const hasStockIssues = Array.from(stockMap.values()).some(
    (info) => info.isOutOfStock || info.exceedsStock,
  );

  return { stockMap, isLoading, hasStockIssues };
}
