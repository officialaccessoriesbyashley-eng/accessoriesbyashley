"use client";

import { useEffect } from "react";
import { useRecentlyViewedActions } from "@/lib/store/recently-viewed-store-provider";

interface TrackRecentlyViewedProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
}

export function TrackRecentlyViewed({ productId, name, price, image, slug }: TrackRecentlyViewedProps) {
  const { trackView } = useRecentlyViewedActions();

  useEffect(() => {
    trackView({ productId, name, price, image, slug });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
