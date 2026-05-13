"use client";

import dynamic from "next/dynamic";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingSpinner from "@/components/loaders/LoadingSpinner";

const SanityAppProvider = dynamic(
  () => import("@/components/providers/SanityAppProvider"),
  {
    ssr: false,
    loading: () => (
      <LoadingSpinner text="Loading Sanity App SDK..." isFullScreen size="lg" />
    ),
  },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SanityAppProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </SanityAppProvider>
  );
}
