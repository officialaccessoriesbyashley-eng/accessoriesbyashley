"use client";

import { Suspense, useState } from "react";
import { useDocument, type DocumentHandle } from "@sanity/sdk-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import {
  ORDER_STATUS_CONFIG,
  getOrderStatus,
} from "@/lib/constants/orderStatus";

interface StatusSelectProps extends DocumentHandle {}

function StatusSelectContent(handle: StatusSelectProps) {
  const { data: status } = useDocument({ ...handle, path: "status" });
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const currentStatus = optimisticStatus ?? (status as string) ?? "paid";
  const statusConfig = getOrderStatus(currentStatus);
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = async (value: string) => {
    setIsPending(true);
    setOptimisticStatus(value);
    try {
      const res = await fetch(
        `/api/admin/orders/${handle.documentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: value }),
        },
      );
      if (!res.ok) throw new Error("Failed to update status");
      setOptimisticStatus(null);
    } catch (err) {
      console.error("Failed to update status:", err);
      setOptimisticStatus(null);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => {
            const Icon = config.icon;
            return (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      )}
    </div>
  );
}

function StatusSelectSkeleton() {
  return <Skeleton className="h-10 w-[180px]" />;
}

export function StatusSelect(props: StatusSelectProps) {
  return (
    <Suspense fallback={<StatusSelectSkeleton />}>
      <StatusSelectContent {...props} />
    </Suspense>
  );
}
