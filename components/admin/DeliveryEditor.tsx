"use client";

import { Suspense } from "react";
import {
  useDocument,
  useEditDocument,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { Truck, Package } from "lucide-react";

const SERVICE_LABELS: Record<string, string> = {
  supermetro: "SuperMetro",
  matatu: "Matatu",
  "pickup-mtaani": "Pickup Mtaani",
  bolt: "Bolt",
  "courier-company": "Courier Company",
  "bus-parcel": "Bus Parcel",
};

export interface DeliveryEditorProps extends DocumentHandle {
  deliveryMethod?: "pickup" | "delivery" | null;
  deliveryAreaName?: string | null;
  deliveryAreaSubZone?: string | null;
  deliveryFee?: number | null;
  deliveryServiceType?: string | null;
  deliveryServiceDetails?: string | null;
}

function DeliveryField({
  handle,
  field,
  label,
  placeholder,
  multiline,
}: {
  handle: DocumentHandle;
  field: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const path = `deliveryAddress.${field}`;
  const { data: value } = useDocument({ ...handle, path });
  const editField = useEditDocument({ ...handle, path });

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field} className="text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={field}
          value={(value as string) ?? ""}
          onChange={(e) => editField(e.target.value)}
          placeholder={placeholder}
          className="min-h-[70px] resize-y text-sm"
        />
      ) : (
        <Input
          id={field}
          value={(value as string) ?? ""}
          onChange={(e) => editField(e.target.value)}
          placeholder={placeholder}
          className="h-9"
        />
      )}
    </div>
  );
}

function DeliveryEditorContent({
  deliveryMethod,
  deliveryAreaName,
  deliveryAreaSubZone,
  deliveryFee,
  deliveryServiceType,
  deliveryServiceDetails,
  ...handle
}: DeliveryEditorProps) {
  const isPickup = deliveryMethod === "pickup";

  return (
    <div className="space-y-4">
      {/* Read-only delivery summary */}
      <div className="space-y-1.5 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          {isPickup ? (
            <Package className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <Truck className="h-3.5 w-3.5 text-zinc-400" />
          )}
          <span className="text-xs font-medium capitalize text-zinc-700 dark:text-zinc-300">
            {deliveryMethod ?? "Not set"}
          </span>
          {deliveryFee != null && (
            <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
              {formatPrice(deliveryFee)}
            </span>
          )}
        </div>
        {deliveryAreaName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {deliveryAreaName}
            {deliveryAreaSubZone ? ` · ${deliveryAreaSubZone}` : ""}
          </p>
        )}
        {deliveryServiceType && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Via: {SERVICE_LABELS[deliveryServiceType] ?? deliveryServiceType}
          </p>
        )}
        {deliveryServiceDetails && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{deliveryServiceDetails}</p>
        )}
        {!deliveryMethod && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No delivery info recorded</p>
        )}
      </div>

      {/* Editable address fields — delivery only */}
      {!isPickup && (
        <div className="space-y-3">
          <Suspense fallback={<Skeleton className="h-16" />}>
            <DeliveryField
              handle={handle as DocumentHandle}
              field="buildingApartment"
              label="Building / Apartment"
              placeholder="e.g. 3rd floor, Karen Mall"
            />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-20" />}>
            <DeliveryField
              handle={handle as DocumentHandle}
              field="directions"
              label="Directions"
              placeholder="e.g. Turn left after the gate..."
              multiline
            />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-9" />}>
            <DeliveryField
              handle={handle as DocumentHandle}
              field="googleMapsLink"
              label="Google Maps Link"
              placeholder="https://maps.google.com/..."
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export function DeliveryEditor(props: DeliveryEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-16" />
          <Skeleton className="h-20" />
        </div>
      }
    >
      <DeliveryEditorContent {...props} />
    </Suspense>
  );
}
