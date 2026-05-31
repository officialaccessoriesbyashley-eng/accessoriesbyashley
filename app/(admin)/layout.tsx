import { SessionProvider } from "next-auth/react";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return <SessionProvider>{children}</SessionProvider>;
}
