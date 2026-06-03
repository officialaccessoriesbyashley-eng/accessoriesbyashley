"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface NavCategory {
  _id: string;
  title: string;
  slug: string;
  icon?: string | null;
  subcategories: { _id: string; title: string; slug: string }[];
}

// ── Desktop mega-menu nav bar ─────────────────────────────────────────────────

export function CategoryNavDesktop({ categories }: { categories: NavCategory[] }) {
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      onMouseLeave={() => setMegaOpen(null)}
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 overflow-x-auto px-4 scrollbar-hide sm:px-6 lg:px-8">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="relative shrink-0"
            onMouseEnter={() => setMegaOpen(cat._id)}
          >
            <Link
              href={`/shop/${cat.slug}`}
              className={cn(
                "flex h-10 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-medium transition-colors",
                pathname.startsWith(`/shop/${cat.slug}`)
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
              )}
            >
              {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
              {cat.title}
            </Link>

            {megaOpen === cat._id && cat.subcategories.length > 0 && (
              <div className="absolute left-0 top-full z-50 min-w-[220px] rounded-b-xl border border-t-0 border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                <div className="py-2">
                  <Link
                    href={`/shop/${cat.slug}`}
                    onClick={() => setMegaOpen(null)}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    All {cat.title}
                  </Link>
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub._id}
                      href={`/shop/${cat.slug}/${sub.slug}`}
                      onClick={() => setMegaOpen(null)}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm transition-colors",
                        pathname === `/shop/${cat.slug}/${sub.slug}`
                          ? "font-medium text-amber-600 dark:text-amber-400"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

// ── Mobile hamburger + drawer ─────────────────────────────────────────────────

export function CategoryNavMobile({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open categories menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto p-0">
          <SheetHeader className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <SheetTitle className="text-left text-base font-semibold">
              Shop by Category
            </SheetTitle>
          </SheetHeader>

          <nav className="py-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              All Products
            </Link>
            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {categories.map((cat) => (
              <MobileCategory
                key={cat._id}
                cat={cat}
                onNavigate={() => setOpen(false)}
                pathname={pathname}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Mobile category row (accordion) ─────────────────────────────────────────

function MobileCategory({
  cat,
  onNavigate,
  pathname,
}: {
  cat: NavCategory;
  onNavigate: () => void;
  pathname: string;
}) {
  const isActive = pathname.startsWith(`/shop/${cat.slug}`);
  const [expanded, setExpanded] = useState(isActive);

  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center">
        <Link
          href={`/shop/${cat.slug}`}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-2 px-4 py-3 text-sm font-medium",
            isActive
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-800 dark:text-zinc-200",
          )}
        >
          {cat.icon && <span className="text-base">{cat.icon}</span>}
          {cat.title}
        </Link>
        {cat.subcategories.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-11 w-10 items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
            />
          </button>
        )}
      </div>
      {expanded && cat.subcategories.length > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          {cat.subcategories.map((sub) => (
            <Link
              key={sub._id}
              href={`/shop/${cat.slug}/${sub.slug}`}
              onClick={onNavigate}
              className={cn(
                "flex items-center px-8 py-2.5 text-sm",
                pathname === `/shop/${cat.slug}/${sub.slug}`
                  ? "font-medium text-amber-600 dark:text-amber-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              {sub.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
