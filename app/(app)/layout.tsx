import { SessionProvider } from "next-auth/react";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { WishlistStoreProvider } from "@/lib/store/wishlist-store-provider";
import { RecentlyViewedStoreProvider } from "@/lib/store/recently-viewed-store-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { Footer } from "@/components/app/Footer";
import { MobileNav } from "@/components/app/MobileNav";
import { CartSheet } from "@/components/app/CartSheet";
import { ChatSheet } from "@/components/app/ChatSheet";
import { WishlistSheet } from "@/components/app/WishlistSheet";
import { RecentlyViewedSheet } from "@/components/app/RecentlyViewedSheet";
import { AppShell } from "@/components/app/AppShell";
import { WhatsAppWidget } from "@/components/app/WhatsAppWidget";
import { NavigationProgress } from "@/components/app/NavigationProgress";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartStoreProvider>
        <ChatStoreProvider>
          <WishlistStoreProvider>
            <RecentlyViewedStoreProvider>
              <AppShell>
                <NavigationProgress />
                {/* Desktop header — hidden on mobile */}
                <div className="hidden md:block">
                  <Header />
                </div>
                {/* Mobile header — hidden on desktop */}
                <MobileNav />
                <main>{children}</main>
                <Footer />
              </AppShell>
              <CartSheet />
              <ChatSheet />
              <WishlistSheet />
              <RecentlyViewedSheet />
              <WhatsAppWidget />
              <Toaster position="bottom-center" />
            </RecentlyViewedStoreProvider>
          </WishlistStoreProvider>
        </ChatStoreProvider>
      </CartStoreProvider>
    </SessionProvider>
  );
}
