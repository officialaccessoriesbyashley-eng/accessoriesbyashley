import { SessionProvider } from "next-auth/react";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { CartSheet } from "@/components/app/CartSheet";
import { ChatSheet } from "@/components/app/ChatSheet";
import { AppShell } from "@/components/app/AppShell";
import { WhatsAppWidget } from "@/components/app/WhatsAppWidget";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <CartStoreProvider>
        <ChatStoreProvider>
         <AppShell>
            <Header />
            <main>{children}</main>
          </AppShell>
          <CartSheet/>
          <ChatSheet />
          <WhatsAppWidget />
          <Toaster position="bottom-center"/>
        </ChatStoreProvider>
      </CartStoreProvider>
    </SessionProvider>
  );
}
