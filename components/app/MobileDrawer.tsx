"use client";

import Link from "next/link";
import { X, Package, User, LogOut, ChevronRight } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cormorant_Garamond } from "next/font/google";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.query-types";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["600"], display: "swap" });

interface MobileDrawerProps {
  categories: ALL_CATEGORIES_QUERYResult;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ categories, isOpen, onClose }: MobileDrawerProps) {
  const { data: session } = useSession();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-sm flex-col bg-white shadow-2xl dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <span className={`${cormorant.className} text-sm tracking-widest text-zinc-900 dark:text-zinc-100`}>
            ACCESSORIES BY ASHLEY
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Account section */}
          <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback className="text-sm">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {session.user.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {session.user.email}
                  </p>
                </div>
              </div>
            ) : (
              <Link
                href="/sign-in"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                <User className="h-4 w-4" />
                Sign in to your account
              </Link>
            )}
          </div>

          {/* Account links */}
          {session?.user && (
            <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <DrawerLink href="/account/profile" icon={<User className="h-4 w-4" />} label="My Profile" onClick={onClose} />
              <DrawerLink href="/orders" icon={<Package className="h-4 w-4" />} label="My Orders" onClick={onClose} />
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}

          {/* Categories */}
          <div className="px-3 py-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Shop by Category
            </p>
            {categories.map((cat) => (
              <DrawerLink
                key={cat._id}
                href={`/shop/${cat.slug}`}
                label={cat.title ?? ""}
                icon={cat.icon ? <span className="text-base">{cat.icon}</span> : null}
                onClick={onClose}
                showChevron
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerLink({
  href,
  label,
  icon,
  onClick,
  showChevron = false,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  showChevron?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
    >
      {icon && <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{icon}</span>}
      <span className="flex-1 font-medium">{label}</span>
      {showChevron && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
    </Link>
  );
}
