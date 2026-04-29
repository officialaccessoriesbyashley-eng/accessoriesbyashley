import { ClerkProvider } from "@clerk/nextjs";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/app/Header";
import { CartSheet } from "@/components/app/CartSheet";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <ChatStoreProvider>
          <Header/>
          <main>{children}</main>
          <CartSheet/>
          <Toaster position="bottom-center"/>
        </ChatStoreProvider>
      </CartStoreProvider>
    </ClerkProvider>
  );
}
