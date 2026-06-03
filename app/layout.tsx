import { Geist, Geist_Mono } from "next/font/google";
import { SanityLive } from "@/sanity/lib/live";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Accessories by Ashley",
  description: "Jewellery & accessories handpicked by Ashley — shop online in Kenya.",
  icons: {
    icon: "/Word-logo.png",
    apple: "/Word-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SanityLive />
      </body>
    </html>
  );
}
