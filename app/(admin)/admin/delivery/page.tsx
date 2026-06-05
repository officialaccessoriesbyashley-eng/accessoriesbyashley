"use client";

import { Suspense, useState, useTransition, useEffect, useCallback, useMemo } from "react";
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import {
  Truck,
  MapPin,
  Settings,
  ToggleLeft,
  ToggleRight,
  Plus,
  Search,
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import {
  patchDeliveryZone,
  createDeliveryZone,
  patchDeliveryArea,
  createDeliveryArea,
  patchDeliverySettings,
  type DeliveryOptionInput,
} from "@/lib/actions/delivery";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_METHODS = [
  { value: "matatu", label: "Matatu Parcel" },
  { value: "supermetro", label: "Supermetro" },
  { value: "pickup-mtaani", label: "Pick up Mtaani" },
  { value: "bolt", label: "Bolt Delivery" },
  { value: "courier-company", label: "Courier Company" },
  { value: "bus-parcel", label: "Bus / SGR Parcel" },
] as const;

type MethodValue = (typeof ALL_METHODS)[number]["value"];

function methodLabel(value: string): string {
  return ALL_METHODS.find((m) => m.value === value)?.label ?? value;
}

function newKey(): string {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Zone row ──────────────────────────────────────────────────────────────────

interface ZoneProjection {
  name: string;
  zoneNumber: number;
  deliveryType: string;
  estimatedDelivery: string;
  description: string;
  allowPayOnDelivery: boolean;
  isActive: boolean;
  areaCount: number;
}

function ZoneRowContent(handle: DocumentHandle) {
  const { data } = useDocumentProjection<ZoneProjection>({
    ...handle,
    projection: `{
      name,
      zoneNumber,
      deliveryType,
      estimatedDelivery,
      description,
      allowPayOnDelivery,
      isActive,
      "areaCount": count(*[_type == "deliveryArea" && zone._ref == ^._id])
    }`,
  });

  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEst, setEditEst] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saved, setSaved] = useState(false);

  if (!data) return null;

  function openEdit() {
    setEditName(data!.name);
    setEditEst(data!.estimatedDelivery ?? "");
    setEditDesc(data!.description ?? "");
    setEditing(true);
    setSaved(false);
  }

  function saveEdit() {
    startTransition(async () => {
      await patchDeliveryZone(handle.documentId, {
        name: editName,
        estimatedDelivery: editEst,
        description: editDesc,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); }, 1200);
    });
  }

  function toggle(field: "allowPayOnDelivery" | "isActive") {
    startTransition(async () => {
      await patchDeliveryZone(handle.documentId, { [field]: !data![field] });
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {data.zoneNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{data.name}</p>
            <Badge variant="outline" className="text-xs capitalize">{data.deliveryType}</Badge>
            {!data.isActive && <Badge className="bg-red-100 text-red-700 text-xs">Inactive</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {data.estimatedDelivery && <span>{data.estimatedDelivery}</span>}
            <span>{data.areaCount} area{data.areaCount === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={editing ? () => setEditing(false) : openEdit}>
            {editing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {editing ? "Cancel" : "Edit"}
          </Button>
          <button type="button" onClick={() => toggle("allowPayOnDelivery")} disabled={isPending} className="flex items-center gap-1.5 text-xs font-medium">
            {data.allowPayOnDelivery ? (
              <><ToggleRight className="h-5 w-5 text-green-600" /><span className="text-green-700 dark:text-green-400">POD on</span></>
            ) : (
              <><ToggleLeft className="h-5 w-5 text-zinc-400" /><span className="text-zinc-500">POD off</span></>
            )}
          </button>
          <button type="button" onClick={() => toggle("isActive")} disabled={isPending} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            {data.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">Zone Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Estimated Delivery</Label>
              <Input value={editEst} onChange={(e) => setEditEst(e.target.value)} placeholder="e.g. Same day" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Short description" className="mt-1 h-8 text-sm" />
            </div>
          </div>
          <Button size="sm" className="mt-3 gap-1.5" onClick={saveEdit} disabled={isPending || !editName}>
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3" /> : null}
            {saved ? "Saved!" : "Save Zone"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ZoneRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-60" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

function ZoneRow(props: DocumentHandle) {
  return (
    <Suspense fallback={<ZoneRowSkeleton />}>
      <ZoneRowContent {...props} />
    </Suspense>
  );
}

// ── Delivery options mini-editor ──────────────────────────────────────────────

interface EditableOption {
  _key: string;
  method: MethodValue | "";
  fee: string;
}

function DeliveryOptionsEditor({
  options,
  onChange,
}: {
  options: EditableOption[];
  onChange: (opts: EditableOption[]) => void;
}) {
  const usedMethods = options.map((o) => o.method).filter(Boolean);
  const availableMethods = ALL_METHODS.filter((m) => !usedMethods.includes(m.value));

  function updateOption(key: string, field: "method" | "fee", value: string) {
    onChange(options.map((o) => (o._key === key ? { ...o, [field]: value } : o)));
  }

  function removeOption(key: string) {
    onChange(options.filter((o) => o._key !== key));
  }

  function addOption() {
    onChange([...options, { _key: newKey(), method: "", fee: "" }]);
  }

  return (
    <div className="space-y-2">
      {options.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No delivery options yet. Add one below.</p>
      )}
      {options.map((opt) => (
        <div key={opt._key} className="flex items-center gap-2">
          <select
            value={opt.method}
            onChange={(e) => updateOption(opt._key, "method", e.target.value)}
            className="h-7 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="">— Select method —</option>
            {ALL_METHODS.map((m) => (
              <option key={m.value} value={m.value} disabled={usedMethods.includes(m.value) && opt.method !== m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">KSh</span>
            <Input
              type="number"
              min={0}
              value={opt.fee}
              onChange={(e) => updateOption(opt._key, "fee", e.target.value)}
              placeholder="0"
              className="h-7 w-20 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => removeOption(opt._key)}
            className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {availableMethods.length > 0 && (
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <Plus className="h-3 w-3" /> Add delivery method
        </button>
      )}
    </div>
  );
}

// ── Area row ──────────────────────────────────────────────────────────────────

interface AreaProjection {
  name: string;
  subZone?: string;
  deliveryOptions: { _key: string; method: string; fee: number }[];
  isActive: boolean;
  zoneName: string;
  zoneNumber: number;
  zoneId: string;
}

function AreaRowContent({
  handle,
  searchQuery,
  zones,
}: {
  handle: DocumentHandle;
  searchQuery: string;
  zones: { id: string; name: string; zoneNumber: number }[];
}) {
  const { data } = useDocumentProjection<AreaProjection>({
    ...handle,
    projection: `{
      name,
      subZone,
      deliveryOptions[]{ _key, method, fee },
      isActive,
      "zoneName": zone->name,
      "zoneNumber": zone->zoneNumber,
      "zoneId": zone._ref
    }`,
  });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSubZone, setEditSubZone] = useState("");
  const [editZoneId, setEditZoneId] = useState("");
  const [editOptions, setEditOptions] = useState<EditableOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!data) return null;

  const lowerName = data.name.toLowerCase();
  const lowerZone = (data.zoneName ?? "").toLowerCase();
  const lowerSub = (data.subZone ?? "").toLowerCase();
  const q = searchQuery.toLowerCase();
  if (searchQuery && !lowerName.includes(q) && !lowerZone.includes(q) && !lowerSub.includes(q)) {
    return null;
  }

  const deliveryOptions = data.deliveryOptions ?? [];

  function openEdit() {
    setEditName(data!.name);
    setEditSubZone(data!.subZone ?? "");
    setEditZoneId(data!.zoneId ?? "");
    setEditOptions(
      (data!.deliveryOptions ?? []).map((o) => ({
        _key: o._key || newKey(),
        method: o.method as MethodValue,
        fee: String(o.fee),
      }))
    );
    setEditing(true);
    setSaved(false);
  }

  function saveEdit() {
    startTransition(async () => {
      const validOptions: DeliveryOptionInput[] = editOptions
        .filter((o) => o.method && o.fee !== "")
        .map((o) => ({ _key: o._key, method: o.method, fee: Number(o.fee) }));

      await patchDeliveryArea(handle.documentId, {
        name: editName,
        subZone: editSubZone || undefined,
        deliveryOptions: validOptions,
        ...(editZoneId && { zone: { _type: "reference", _ref: editZoneId } }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); }, 1200);
    });
  }

  function toggleActive() {
    startTransition(async () => {
      await patchDeliveryArea(handle.documentId, { isActive: !data!.isActive });
    });
  }

  return (
    <>
      <div className={`flex items-center gap-2 px-4 py-2.5 text-sm ${!data.isActive ? "opacity-50" : ""}`}>
        <span className="hidden shrink-0 items-center justify-center rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 sm:flex">
          Z{data.zoneNumber}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{data.name}</span>
          {data.subZone && <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">{data.subZone}</span>}
        </div>
        {/* Delivery options summary */}
        <div className="hidden flex-wrap gap-1 sm:flex">
          {deliveryOptions.length === 0 ? (
            <span className="text-xs text-zinc-400">No options</span>
          ) : (
            deliveryOptions.map((o) => (
              <span key={o._key || o.method} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {methodLabel(o.method)} {formatPrice(o.fee)}
              </span>
            ))
          )}
        </div>
        <button type="button" onClick={editing ? () => setEditing(false) : openEdit} className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
          {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={toggleActive} disabled={isPending} className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          {data.isActive ? "Off" : "On"}
        </button>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Area Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 h-7 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Sub-zone (optional)</Label>
              <Input value={editSubZone} onChange={(e) => setEditSubZone(e.target.value)} placeholder="e.g. A – Thika Road" className="mt-1 h-7 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Zone</Label>
              <select value={editZoneId} onChange={(e) => setEditZoneId(e.target.value)} className="mt-1 h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                <option value="">Select zone…</option>
                {zones.map((z) => <option key={z.id} value={z.id}>Zone {z.zoneNumber}: {z.name}</option>)}
              </select>
            </div>
          </div>

          {/* Delivery options editor */}
          <div className="mt-3">
            <Label className="text-xs">Delivery Options</Label>
            <div className="mt-1.5">
              <DeliveryOptionsEditor options={editOptions} onChange={setEditOptions} />
            </div>
          </div>

          <Button size="sm" className="mt-3 h-7 gap-1 text-xs" onClick={saveEdit} disabled={isPending || !editName}>
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3" /> : null}
            {saved ? "Saved!" : "Save"}
          </Button>
        </div>
      )}
    </>
  );
}

// ── Add Area form ─────────────────────────────────────────────────────────────

function AddAreaForm({ zones, onDone }: { zones: { id: string; name: string; zoneNumber: number }[]; onDone: () => void }) {
  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [subZone, setSubZone] = useState("");
  const [options, setOptions] = useState<EditableOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim() || !zoneId) { setError("Name and zone are required."); return; }
    const validOptions = options.filter((o) => o.method && o.fee !== "");
    if (validOptions.length === 0) { setError("Add at least one delivery option."); return; }
    setError("");
    startTransition(async () => {
      const id = `area-${zoneId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      await createDeliveryArea({
        _id: id,
        name: name.trim(),
        zone: { _type: "reference", _ref: zoneId },
        ...(subZone.trim() ? { subZone: subZone.trim() } : {}),
        deliveryOptions: validOptions.map((o) => ({ _key: o._key, method: o.method, fee: Number(o.fee) })),
        isActive: true,
        sortOrder: 0,
      });
      onDone();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add New Area</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Area Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Westlands" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Zone *</Label>
          <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
            <option value="">Select zone…</option>
            {zones.map((z) => <option key={z.id} value={z.id}>Zone {z.zoneNumber}: {z.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Sub-zone (optional)</Label>
          <Input value={subZone} onChange={(e) => setSubZone(e.target.value)} placeholder="e.g. A – Thika Road" className="mt-1 h-8 text-sm" />
        </div>
      </div>

      <div className="mt-3">
        <Label className="text-xs">Delivery Options *</Label>
        <div className="mt-1.5">
          <DeliveryOptionsEditor options={options} onChange={setOptions} />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Add Area
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Areas tab ──────────────────────────────────────────────────────────────────

function AreasTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: areas } = useDocuments({
    documentType: "deliveryArea",
    orderings: [
      { field: "zone.zoneNumber", direction: "asc" },
      { field: "subZone", direction: "asc" },
      { field: "name", direction: "asc" },
    ],
  });

  const { data: zoneDocs } = useDocuments({
    documentType: "deliveryZone",
    orderings: [{ field: "zoneNumber", direction: "asc" }],
  });

  return (
    <ZoneListLoader
      zoneDocs={zoneDocs ?? []}
      areas={areas ?? []}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showAddForm={showAddForm}
      setShowAddForm={setShowAddForm}
    />
  );
}

function ZoneListLoader({ zoneDocs, areas, searchQuery, setSearchQuery, showAddForm, setShowAddForm }: {
  zoneDocs: DocumentHandle[];
  areas: DocumentHandle[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  showAddForm: boolean;
  setShowAddForm: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input placeholder="Search areas…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Area"}
        </Button>
      </div>

      {showAddForm && (
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <ZoneDataForAddForm zoneDocs={zoneDocs} onDone={() => setShowAddForm(false)} />
        </Suspense>
      )}

      {areas.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No areas found. Run the seed script or add one above.</p>
      ) : (
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <ZoneDataForAreaRows zoneDocs={zoneDocs} areas={areas} searchQuery={searchQuery} />
        </Suspense>
      )}
    </div>
  );
}

interface ZoneBasic { id: string; name: string; zoneNumber: number }

function ZoneDataForAddForm({ zoneDocs, onDone }: { zoneDocs: DocumentHandle[]; onDone: () => void }) {
  return <ZoneProjectionLoader zoneDocs={zoneDocs}>{(zones) => <AddAreaForm zones={zones} onDone={onDone} />}</ZoneProjectionLoader>;
}

function ZoneDataForAreaRows({ zoneDocs, areas, searchQuery }: { zoneDocs: DocumentHandle[]; areas: DocumentHandle[]; searchQuery: string }) {
  return (
    <ZoneProjectionLoader zoneDocs={zoneDocs}>
      {(zones) => (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {areas.map((handle) => (
              <Suspense key={handle.documentId} fallback={null}>
                <AreaRowContent handle={handle} searchQuery={searchQuery} zones={zones} />
              </Suspense>
            ))}
          </div>
        </div>
      )}
    </ZoneProjectionLoader>
  );
}

function ZoneNameFetcher({ handle, onData }: { handle: DocumentHandle; onData: (id: string, name: string, zoneNumber: number) => void }) {
  const { data } = useDocumentProjection<{ name: string; zoneNumber: number }>({ ...handle, projection: `{ name, zoneNumber }` });
  useEffect(() => { if (data) onData(handle.documentId, data.name, data.zoneNumber); }, [data, handle.documentId, onData]);
  return null;
}

function ZoneProjectionLoader({ zoneDocs, children }: { zoneDocs: DocumentHandle[]; children: (zones: ZoneBasic[]) => React.ReactNode }) {
  const [zoneMap, setZoneMap] = useState<Map<string, ZoneBasic>>(new Map());
  const handleData = useCallback((id: string, name: string, zoneNumber: number) => {
    setZoneMap((prev) => { const next = new Map(prev); next.set(id, { id, name, zoneNumber }); return next; });
  }, []);
  const zones = useMemo(() => Array.from(zoneMap.values()).sort((a, b) => a.zoneNumber - b.zoneNumber), [zoneMap]);
  return (
    <>
      {zoneDocs.map((handle) => <ZoneNameFetcher key={handle.documentId} handle={handle} onData={handleData} />)}
      {children(zones)}
    </>
  );
}

// ── Add Zone form ─────────────────────────────────────────────────────────────

function AddZoneForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [zoneNumber, setZoneNumber] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery" | "courier">("delivery");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim() || zoneNumber === "") { setError("Name and zone number are required."); return; }
    const num = Number(zoneNumber);
    if (isNaN(num) || num < 0 || num > 10) { setError("Zone number must be between 0 and 10."); return; }
    setError("");
    startTransition(async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await createDeliveryZone({
        _id: `zone-${num}-${slug}`,
        name: name.trim(),
        zoneNumber: num,
        deliveryType,
        ...(estimatedDelivery.trim() ? { estimatedDelivery: estimatedDelivery.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        allowPayOnDelivery: false,
        isActive: true,
        sortOrder: num,
      });
      onDone();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add New Zone</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Zone Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Within CBD" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Zone Number *</Label>
          <Input type="number" min={0} value={zoneNumber} onChange={(e) => setZoneNumber(e.target.value)} placeholder="e.g. 1" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Delivery Type *</Label>
          <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as "pickup" | "delivery" | "courier")} className="mt-1 h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
            <option value="courier">Courier</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Estimated Delivery</Label>
          <Input value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} placeholder="e.g. Same day" className="mt-1 h-8 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description for customers" className="mt-1 h-8 text-sm" />
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Add Zone
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Zones tab ──────────────────────────────────────────────────────────────────

function ZonesTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: zones } = useDocuments({ documentType: "deliveryZone", orderings: [{ field: "zoneNumber", direction: "asc" }] });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Zone"}
        </Button>
      </div>
      {showAddForm && <AddZoneForm onDone={() => setShowAddForm(false)} />}
      {!zones || zones.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No delivery zones found. Run the seed script to populate zones.</p>
      ) : (
        <div className="space-y-3">
          {zones.map((handle) => <ZoneRow key={handle.documentId} {...handle} />)}
        </div>
      )}
    </div>
  );
}

// ── Settings panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const { data: settingsDocs } = useDocuments({ documentType: "deliverySettings" });
  const settingsHandle = settingsDocs?.[0];
  if (!settingsHandle) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Delivery settings not found. Run the seed script first.</p>;
  }
  return <Suspense fallback={<Skeleton className="h-40 w-full" />}><SettingsForm handle={settingsHandle} /></Suspense>;
}

interface SettingsProjection { freeDeliveryThreshold?: number; payOnDeliveryDepositPercent?: number; deliveryNotice?: string }

function SettingsForm({ handle }: { handle: DocumentHandle }) {
  const { data } = useDocumentProjection<SettingsProjection>({ ...handle, projection: `{ freeDeliveryThreshold, payOnDeliveryDepositPercent, deliveryNotice }` });
  const [threshold, setThreshold] = useState<string>("");
  const [depositPercent, setDepositPercent] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [initialized, setInitialized] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (data && !initialized) {
    setThreshold(String(data.freeDeliveryThreshold ?? ""));
    setDepositPercent(String(data.payOnDeliveryDepositPercent ?? 0));
    setNotice(data.deliveryNotice ?? "");
    setInitialized(true);
  }

  function save() {
    startTransition(async () => {
      await patchDeliverySettings(handle.documentId, {
        freeDeliveryThreshold: threshold ? Number(threshold) : undefined,
        payOnDeliveryDepositPercent: Number(depositPercent),
        deliveryNotice: notice,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
      <div>
        <Label htmlFor="threshold">Free Delivery Threshold (KSh)</Label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Orders above this amount qualify for free delivery. Leave blank to disable.</p>
        <Input id="threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="e.g. 5000" className="mt-2" />
      </div>
      <div>
        <Label htmlFor="deposit">Pay-on-Delivery Deposit (%)</Label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Percentage of order total required upfront. Set to 0 for no deposit.</p>
        <Input id="deposit" type="number" min={0} max={100} value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className="mt-2 w-32" />
      </div>
      <div>
        <Label htmlFor="notice">Delivery Notice</Label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Shown at checkout. e.g. &ldquo;Orders after 4 PM ship next business day.&rdquo;</p>
        <textarea id="notice" rows={3} value={notice} onChange={(e) => setNotice(e.target.value)} placeholder="Enter a notice for customers at checkout…" className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100" />
      </div>
      <Button onClick={save} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Settings className="mr-2 h-4 w-4" />}
        {saved ? "Saved!" : "Save Settings"}
      </Button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DeliveryPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">Delivery Management</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">Manage zones, areas, delivery methods, and settings</p>
      </div>

      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones"><Truck className="mr-1.5 h-4 w-4" />Zones</TabsTrigger>
          <TabsTrigger value="areas"><MapPin className="mr-1.5 h-4 w-4" />Areas</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-1.5 h-4 w-4" />Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="zones" className="mt-4">
          <Suspense fallback={<div className="space-y-3">{[1,2,3,4,5,6].map((i) => <ZoneRowSkeleton key={i} />)}</div>}>
            <ZonesTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="areas" className="mt-4">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <AreasTab />
          </Suspense>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <SettingsPanel />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
