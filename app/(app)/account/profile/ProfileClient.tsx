"use client";

import { useState, useTransition, useMemo } from "react";
import {
  User,
  Phone,
  MapPin,
  Bell,
  Plus,
  Trash2,
  Star,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { LocationPicker } from "@/components/ui/location-picker";
import { formatPrice } from "@/lib/utils";
import {
  updateCustomerProfile,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
} from "@/lib/actions/customer";

// ── Types ────────────────────────────────────────────────────────────────────

interface Area {
  _id: string;
  name: string;
  subZone?: string;
  deliveryFee: number;
  zoneId: string;
  zoneName: string;
  zoneNumber: number;
}

interface SavedAddress {
  _key: string;
  label: string;
  directions?: string;
  buildingApartment?: string;
  googleMapsLink?: string;
  isDefault?: boolean;
  deliveryArea?: {
    _id: string;
    name: string;
    subZone?: string;
    deliveryFee: number;
    zoneId: string;
    zoneName: string;
    zoneNumber: number;
  };
}

interface Customer {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  whatsappNumber?: string;
  birthday?: string;
  profileImageUrl?: string;
  defaultDeliveryMethod?: "pickup" | "delivery";
  savedAddresses?: SavedAddress[];
  whatsappOptInTransactional?: boolean;
  whatsappOptInMarketing?: boolean;
  emailOptIn?: boolean;
}

interface ProfileClientProps {
  customer: Customer | null;
  areas: Area[];
  userEmail: string;
}

// ── Address form ─────────────────────────────────────────────────────────────

function AddressForm({
  areas,
  initial,
  onSave,
  onCancel,
  saving,
}: {
  areas: Area[];
  initial?: SavedAddress;
  onSave: (data: {
    label: string;
    deliveryAreaId: string;
    directions: string;
    buildingApartment: string;
    googleMapsLink: string;
    isDefault: boolean;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [areaId, setAreaId] = useState(initial?.deliveryArea?._id ?? "");
  const [directions, setDirections] = useState(initial?.directions ?? "");
  const [buildingApartment, setBuildingApartment] = useState(initial?.buildingApartment ?? "");
  const [googleMapsLink, setGoogleMapsLink] = useState(initial?.googleMapsLink ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  const groupedAreas = useMemo(() => {
    const groups: Record<string, { zoneName: string; zoneNumber: number; subZone: string; items: Area[] }> = {};
    for (const area of areas) {
      const key = `${area.zoneId}::${area.subZone ?? ""}`;
      if (!groups[key]) {
        groups[key] = {
          zoneName: area.zoneName,
          zoneNumber: area.zoneNumber,
          subZone: area.subZone ?? "",
          items: [],
        };
      }
      groups[key].items.push(area);
    }
    return Object.values(groups).sort((a, b) =>
      a.zoneNumber !== b.zoneNumber
        ? a.zoneNumber - b.zoneNumber
        : a.subZone.localeCompare(b.subZone)
    );
  }, [areas]);

  const selectedArea = areas.find((a) => a._id === areaId);

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <Label>Label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='e.g. "Home", "Office"'
          className="mt-1"
        />
      </div>

      <div>
        <Label>Area / Estate</Label>
        <Combobox value={areaId} onValueChange={(v) => setAreaId(v as string)}>
          <ComboboxInput
            placeholder="Search area…"
            showClear={!!areaId}
            className="mt-1 w-full"
          />
          <ComboboxContent className="w-full">
            <ComboboxEmpty>No areas found.</ComboboxEmpty>
            <ComboboxList>
              {groupedAreas.map((group) => (
                <ComboboxGroup key={`${group.zoneNumber}::${group.subZone}`}>
                  <ComboboxLabel>
                    {group.subZone
                      ? `Zone ${group.zoneNumber} › ${group.subZone}`
                      : `Zone ${group.zoneNumber}: ${group.zoneName}`}
                  </ComboboxLabel>
                  {group.items.map((area: Area) => (
                    <ComboboxItem key={area._id} value={area._id}>
                      <span className="flex-1">{area.name}</span>
                      <span className="ml-auto text-xs text-zinc-400">
                        {formatPrice(area.deliveryFee)}
                      </span>
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {selectedArea && (
          <p className="mt-1 text-xs text-zinc-500">
            {selectedArea.zoneName}
            {selectedArea.subZone && ` › ${selectedArea.subZone}`} —{" "}
            {formatPrice(selectedArea.deliveryFee)}
          </p>
        )}
      </div>

      <div>
        <Label>
          How to find you{" "}
          <span className="text-zinc-400">(optional)</span>
        </Label>
        <Textarea
          value={directions}
          onChange={(e) => setDirections(e.target.value)}
          placeholder="e.g. Blue gate near Total station, opposite Sarit Centre"
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label>
          Building / Apartment{" "}
          <span className="text-zinc-400">(optional)</span>
        </Label>
        <Input
          value={buildingApartment}
          onChange={(e) => setBuildingApartment(e.target.value)}
          placeholder="e.g. Westgate Mall, 3rd Floor, Suite 10"
          className="mt-1"
        />
      </div>

      <LocationPicker
        value={googleMapsLink}
        onChange={setGoogleMapsLink}
        label="Pin Your Location"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <Label htmlFor="isDefault" className="cursor-pointer font-normal">
          Set as default address
        </Label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() =>
            onSave({ label, deliveryAreaId: areaId, directions, buildingApartment, googleMapsLink, isDefault })
          }
          disabled={saving || !label || !areaId}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProfileClient({ customer, areas, userEmail }: ProfileClientProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bio fields
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(customer?.whatsappNumber ?? "");
  const [birthday, setBirthday] = useState(customer?.birthday ?? "");
  const [defaultMethod, setDefaultMethod] = useState<"pickup" | "delivery">(
    customer?.defaultDeliveryMethod ?? "delivery"
  );
  const [whatsappTransactional, setWhatsappTransactional] = useState(
    customer?.whatsappOptInTransactional ?? true
  );
  const [whatsappMarketing, setWhatsappMarketing] = useState(
    customer?.whatsappOptInMarketing ?? false
  );
  const [emailOptIn, setEmailOptIn] = useState(customer?.emailOptIn ?? true);

  // Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>(
    customer?.savedAddresses ?? []
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [addrSaving, setAddrSaving] = useState(false);

  function handleSaveBio() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateCustomerProfile({
          name,
          phone,
          whatsappNumber: whatsapp,
          birthday: birthday || undefined,
          defaultDeliveryMethod: defaultMethod,
          whatsappOptInTransactional: whatsappTransactional,
          whatsappOptInMarketing: whatsappMarketing,
          emailOptIn,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  async function handleAddAddress(data: {
    label: string;
    deliveryAreaId: string;
    directions: string;
    buildingApartment: string;
    googleMapsLink: string;
    isDefault: boolean;
  }) {
    setAddrSaving(true);
    try {
      const result = await addSavedAddress(data);
      if (result.success) {
        const area = areas.find((a) => a._id === data.deliveryAreaId);
        const newAddr: SavedAddress = {
          _key: result.key!,
          label: data.label,
          directions: data.directions,
          buildingApartment: data.buildingApartment,
          googleMapsLink: data.googleMapsLink,
          isDefault: data.isDefault ?? false,
          deliveryArea: area
            ? {
                _id: area._id,
                name: area.name,
                subZone: area.subZone,
                deliveryFee: area.deliveryFee,
                zoneId: area.zoneId,
                zoneName: area.zoneName,
                zoneNumber: area.zoneNumber,
              }
            : undefined,
        };
        if (data.isDefault) {
          setAddresses((prev) => [
            ...prev.map((a) => ({ ...a, isDefault: false })),
            newAddr,
          ]);
        } else {
          setAddresses((prev) => [...prev, newAddr]);
        }
        setShowAddForm(false);
      }
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleUpdateAddress(
    key: string,
    data: {
      label: string;
      deliveryAreaId: string;
      directions: string;
      buildingApartment: string;
      googleMapsLink: string;
      isDefault: boolean;
    }
  ) {
    setAddrSaving(true);
    try {
      await updateSavedAddress(key, data);
      const area = areas.find((a) => a._id === data.deliveryAreaId);
      setAddresses((prev) =>
        prev.map((a) => {
          if (a._key === key) {
            return {
              ...a,
              label: data.label,
              directions: data.directions,
              buildingApartment: data.buildingApartment,
              googleMapsLink: data.googleMapsLink,
              isDefault: data.isDefault,
              deliveryArea: area
                ? {
                    _id: area._id,
                    name: area.name,
                    subZone: area.subZone,
                    deliveryFee: area.deliveryFee,
                    zoneId: area.zoneId,
                    zoneName: area.zoneName,
                    zoneNumber: area.zoneNumber,
                  }
                : a.deliveryArea,
            };
          }
          if (data.isDefault) return { ...a, isDefault: false };
          return a;
        })
      );
      setEditingKey(null);
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleDeleteAddress(key: string) {
    if (!confirm("Remove this address?")) return;
    await deleteSavedAddress(key);
    setAddresses((prev) => prev.filter((a) => a._key !== key));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        My Profile
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {userEmail}
      </p>

      <div className="mt-8 space-y-8">
        {/* ── Bio section ───────────────────────────────────────────────── */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-zinc-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Personal Info
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">
                <Phone className="mr-1 inline h-3.5 w-3.5" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">
                WhatsApp{" "}
                <span className="text-zinc-400">(if different from phone)</span>
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="birthday">
                Birthday{" "}
                <span className="text-zinc-400">(optional)</span>
              </Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleSaveBio}
            disabled={isPending}
            className="mt-5 w-full sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </section>

        {/* ── Delivery preference ───────────────────────────────────────── */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-zinc-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Delivery Preference
            </h2>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setDefaultMethod("delivery")}
              className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                defaultMethod === "delivery"
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
              }`}
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                I usually get delivery
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Pre-selects delivery at checkout
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDefaultMethod("pickup")}
              className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                defaultMethod === "pickup"
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
              }`}
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                I usually pick up
              </p>
              <p className="text-zinc-500 dark:text-zinc-400">
                Pre-selects pickup at checkout
              </p>
            </button>
          </div>
        </section>

        {/* ── Saved addresses ───────────────────────────────────────────── */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-zinc-500" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Saved Addresses
              </h2>
            </div>
            {!showAddForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {addresses.map((addr) =>
              editingKey === addr._key ? (
                <AddressForm
                  key={addr._key}
                  areas={areas}
                  initial={addr}
                  saving={addrSaving}
                  onSave={(data) => handleUpdateAddress(addr._key, data)}
                  onCancel={() => setEditingKey(null)}
                />
              ) : (
                <div
                  key={addr._key}
                  className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {addr.label}
                      </p>
                      {addr.isDefault && (
                        <Badge variant="outline" className="text-[10px]">
                          <Star className="mr-0.5 h-2.5 w-2.5" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {addr.deliveryArea && (
                      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {addr.deliveryArea.name} — {formatPrice(addr.deliveryArea.deliveryFee)}
                      </p>
                    )}
                    {(addr.buildingApartment || addr.directions) && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">
                        {[addr.buildingApartment, addr.directions].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingKey(addr._key)}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteAddress(addr._key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            )}

            {addresses.length === 0 && !showAddForm && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No saved addresses yet. Add one to speed up checkout.
              </p>
            )}

            {showAddForm && (
              <AddressForm
                areas={areas}
                saving={addrSaving}
                onSave={handleAddAddress}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </div>
        </section>

        {/* ── Communication prefs ───────────────────────────────────────── */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-zinc-500" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Notifications
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappTransactional}
                onChange={(e) => setWhatsappTransactional(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  WhatsApp order updates
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Confirmations, dispatch & delivery notifications
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappMarketing}
                onChange={(e) => setWhatsappMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  WhatsApp promotions
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  New arrivals, sales, and special offers
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Email notifications
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Order receipts and account updates
                </p>
              </div>
            </label>
          </div>

          <Button
            onClick={handleSaveBio}
            disabled={isPending}
            className="mt-5 w-full sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {saved ? "Saved!" : "Save Preferences"}
          </Button>
        </section>
      </div>
    </div>
  );
}
