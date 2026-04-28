import { SanityLive } from "@/sanity/lib/live";
import { ClerkProvider } from "@clerk/nextjs";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <main>{children}</main>
      </CartStoreProvider>
      <SanityLive/>
    </ClerkProvider>
  );
}
