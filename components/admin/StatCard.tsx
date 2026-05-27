"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useDocuments } from "@sanity/sdk-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  icon: LucideIcon;
  documentType: string;
  filter?: string;
  valueFormatter?: (count: number) => string;
  href?: string;
}

function StatCardContent({
  title,
  icon: Icon,
  documentType,
  filter,
  valueFormatter = (count) => count.toString(),
  href,
}: StatCardProps) {
  const { data } = useDocuments({
    documentType,
    filter,
  });

  const count = data?.length ?? 0;

  const content = (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6",
        href &&
          "cursor-pointer transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:mt-2 sm:text-3xl">
            {valueFormatter(count)}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 sm:h-12 sm:w-12">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function StatCardSkeleton({
  title,
  icon: Icon,
}: Pick<StatCardProps, "title" | "icon">) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <Skeleton className="mt-2 h-8 w-16 sm:h-9 sm:w-20" />
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 sm:h-12 sm:w-12">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}

export function StatCard(props: StatCardProps) {
  return (
    <Suspense
      fallback={<StatCardSkeleton title={props.title} icon={props.icon} />}
    >
      <StatCardContent {...props} />
    </Suspense>
  );
}
