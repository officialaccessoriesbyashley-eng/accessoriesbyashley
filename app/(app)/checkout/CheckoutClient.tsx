"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
  Loader2,
  MapPin,
  Store,
  Truck,
  Phone,
  CheckCircle2,
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
  useCartItems,
  useTotalPrice,
  useTotalItems,
} from "@/lib/store/cart-store-provider";
import { useCartStock } from "@/lib/hooks/useCartStock";
import {
  createCheckoutSession,
  createPayOnDeliveryOrder,
  type DeliveryInfo,
} from "@/lib/actions/checkout";

// ── Types ────────────────────────────────────────────────────────────────────

interface Zone {
  _id: string;
  name: string;
  zoneNumber: number;
  deliveryType: string;
  baseFee: number;
  estimatedDelivery: string;
  allowPayOnDelivery: boolean;
}

interface Area {
  _id: string;
  name: string;
  subZone?: string;
  deliveryFee: number;
  zoneId: string;
  zoneName: string;
  zoneNumber: number;
  allowPayOnDelivery: boolean;
  estimatedDelivery: string;
}

interface PickupStation {
  _id: string;
  name: string;
  address: string;
  landmark?: string;
  operatingHours?: string;
  phone?: string;
  whatsappNumber?: string;
  googleMapsLink?: string;
}

interface DeliverySettings {
  freeDeliveryThreshold?: number;
  freeDeliveryZones?: { _id: string; zoneNumber: number }[];
  payOnDeliveryDepositPercent?: number;
  deliveryNotice?: string;
  defaultPickupStation?: PickupStation;
}

interface CheckoutClientProps {
  zones: Zone[];
  areas: Area[];
  settings: DeliverySettings | null;
  pickupStation: PickupStation | null;
}

type Step = "contact" | "delivery" | "payment";

// ── Helpers ──────────────────────────────────────────────────────────────────

function isFreeDelivery(
  settings: DeliverySettings | null,
  subtotal: number,
  zoneId: string | undefined
): boolean {
  if (!settings?.freeDeliveryThreshold || !zoneId) return false;
  if (subtotal < settings.freeDeliveryThreshold) return false;
  return (
    settings.freeDeliveryZones?.some((z) => z._id === zoneId) ?? false
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "contact", label: "Contact" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  done
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-2 border-zinc-300 text-zinc-400 dark:border-zinc-700"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-5 h-px w-12 sm:w-20 ${done ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CheckoutClient({
  zones,
  areas,
  settings,
  pickupStation,
}: CheckoutClientProps) {
  const { data: session } = useSession();
  const items = useCartItems();
  const subtotal = useTotalPrice();
  const totalItems = useTotalItems();
  const { stockMap, isLoading: stockLoading, hasStockIssues } = useCartStock(items);

  const [step, setStep] = useState<Step>("contact");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Contact
  const [name, setName] = useState(session?.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("delivery");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [directions, setDirections] = useState("");
  const [buildingApartment, setBuildingApartment] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"online" | "pay-on-delivery">("online");

  const selectedArea = useMemo(
    () => areas.find((a) => a._id === selectedAreaId),
    [areas, selectedAreaId]
  );

  const effectiveDeliveryFee = useMemo(() => {
    if (deliveryMethod === "pickup") return 0;
    if (!selectedArea) return 0;
    if (isFreeDelivery(settings, subtotal, selectedArea.zoneId)) return 0;
    return selectedArea.deliveryFee;
  }, [deliveryMethod, selectedArea, settings, subtotal]);

  const total = subtotal + effectiveDeliveryFee;

  const allowPOD =
    deliveryMethod === "pickup"
      ? zones.find((z) => z.zoneNumber === 0)?.allowPayOnDelivery ?? false
      : selectedArea?.allowPayOnDelivery ?? false;

  const podDepositPercent = settings?.payOnDeliveryDepositPercent ?? 0;
  const depositAmount =
    podDepositPercent > 0
      ? Math.round((total * podDepositPercent) / 100)
      : 0;

  // Group areas by zone then sub-zone for combobox
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
    return Object.values(groups).sort((a, b) => {
      if (a.zoneNumber !== b.zoneNumber) return a.zoneNumber - b.zoneNumber;
      return a.subZone.localeCompare(b.subZone);
    });
  }, [areas]);

  const effectiveWhatsapp = sameAsPhone ? phone : whatsapp;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Your cart is empty
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Add some items before checking out.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────

  function canProceedFromContact() {
    return name.trim().length > 0 && phone.trim().length > 0;
  }

  function canProceedFromDelivery() {
    if (deliveryMethod === "pickup") return true;
    return !!selectedAreaId;
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleContactNext() {
    if (!canProceedFromContact()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setError(null);
    setStep("delivery");
  }

  function handleDeliveryNext() {
    if (!canProceedFromDelivery()) {
      setError("Please select your delivery area.");
      return;
    }
    setError(null);
    setStep("payment");
  }

  function buildDeliveryInfo(): DeliveryInfo {
    return {
      method: deliveryMethod,
      zoneId: deliveryMethod === "pickup"
        ? zones.find((z) => z.zoneNumber === 0)?._id
        : selectedArea?.zoneId,
      areaId: deliveryMethod === "delivery" ? selectedAreaId : undefined,
      deliveryFee: effectiveDeliveryFee,
      directions,
      buildingApartment,
      googleMapsLink,
      customerPhone: phone,
      customerWhatsapp: effectiveWhatsapp,
    };
  }

  function handlePayOnline() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(items, buildDeliveryInfo());
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  function handlePayOnDelivery() {
    setError(null);
    startTransition(async () => {
      const result = await createPayOnDeliveryOrder(items, buildDeliveryInfo());
      if (result.success) {
        window.location.href = "/checkout/success?pod=1";
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const station = pickupStation ?? settings?.defaultPickupStation ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Checkout
        </h1>
        <div className="mt-6">
          <Stepper current={step} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left — form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stock issues */}
          {hasStockIssues && !stockLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Some items have stock issues. Please update your cart.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Delivery notice */}
          {settings?.deliveryNotice && step === "delivery" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
              {settings.deliveryNotice}
            </div>
          )}

          {/* ── STEP 1: CONTACT ─────────────────────────────────────────── */}
          {step === "contact" && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-3.5 w-3.5" />
                    Phone Number
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAsPhone"
                      checked={sameAsPhone}
                      onChange={(e) => setSameAsPhone(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <Label htmlFor="sameAsPhone" className="cursor-pointer font-normal">
                      WhatsApp is the same number
                    </Label>
                  </div>
                  {!sameAsPhone && (
                    <Input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="WhatsApp number"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
              <Button
                onClick={handleContactNext}
                className="mt-6 w-full"
                disabled={!canProceedFromContact()}
              >
                Continue to Delivery
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: DELIVERY ────────────────────────────────────────── */}
          {step === "delivery" && (
            <div className="space-y-4">
              {/* Pickup option */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  deliveryMethod === "pickup"
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Free Pickup — Nairobi CBD
                    </p>
                    {station && (
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {station.address}
                        {station.landmark && ` · Near ${station.landmark}`}
                      </p>
                    )}
                    {station?.operatingHours && (
                      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        {station.operatingHours}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs">
                      Ready in 2 hours · Free
                    </Badge>
                  </div>
                </div>
              </button>

              {/* Delivery option */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  deliveryMethod === "delivery"
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-400" />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Delivery to your door
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Nairobi and beyond
                    </p>
                  </div>
                </div>
              </button>

              {/* Delivery form */}
              {deliveryMethod === "delivery" && (
                <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
                  <div>
                    <Label>
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />
                      Your Area / Estate
                    </Label>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Type to search — fee shown next to each area
                    </p>
                    <Combobox
                      value={selectedAreaId}
                      onValueChange={(val) => setSelectedAreaId(val as string)}
                    >
                      <ComboboxInput
                        placeholder="Search area… e.g. Westlands, Karen, Thika"
                        showClear={!!selectedAreaId}
                        className="mt-2 w-full"
                      />
                      <ComboboxContent className="w-full">
                        <ComboboxEmpty>No areas found.</ComboboxEmpty>
                        <ComboboxList>
                          {groupedAreas.map((group) => (
                            <ComboboxGroup key={`${group.zoneName}::${group.subZone}`}>
                              <ComboboxLabel>
                                {group.subZone
                                  ? `Zone ${group.zoneNumber} › ${group.subZone}`
                                  : `Zone ${group.zoneNumber}: ${group.zoneName}`}
                              </ComboboxLabel>
                              {group.items.map((area: Area) => (
                                <ComboboxItem
                                  key={area._id}
                                  value={area._id}
                                >
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
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Estimated delivery:{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {selectedArea.estimatedDelivery}
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="directions">
                      How to find you{" "}
                      <span className="text-zinc-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="directions"
                      value={directions}
                      onChange={(e) => setDirections(e.target.value)}
                      placeholder="e.g. Blue gate near Total station, opposite Sarit Centre, ask for the watchman"
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="building">
                      Building / Apartment{" "}
                      <span className="text-zinc-400">(optional)</span>
                    </Label>
                    <Input
                      id="building"
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
                </div>
              )}

              {/* Pickup details */}
              {deliveryMethod === "pickup" && station && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 text-sm space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {station.name}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">{station.address}</p>
                  {station.operatingHours && (
                    <p className="text-zinc-500 dark:text-zinc-500">{station.operatingHours}</p>
                  )}
                  {station.googleMapsLink && (
                    <a
                      href={station.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <MapPin className="h-3 w-3" />
                      View on Google Maps
                    </a>
                  )}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    We&apos;ll WhatsApp you at{" "}
                    <span className="font-medium">{phone}</span> when your
                    order is ready.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("contact")}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleDeliveryNext}
                  className="flex-1"
                  disabled={!canProceedFromDelivery()}
                >
                  Review Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PAYMENT ─────────────────────────────────────────── */}
          {step === "payment" && (
            <div className="space-y-4">
              {/* Delivery summary */}
              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Delivery Summary
                </h2>
                <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Method: </span>
                    {deliveryMethod === "pickup"
                      ? `Pickup — ${station?.name ?? "CBD Station"}`
                      : `Delivery to ${selectedArea?.name ?? "your address"}`}
                  </p>
                  {deliveryMethod === "delivery" && (directions || buildingApartment) && (
                    <p>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        Address:{" "}
                      </span>
                      {[buildingApartment, directions].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {deliveryMethod === "delivery" && selectedArea && (
                    <p>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        Est. delivery:{" "}
                      </span>
                      {selectedArea.estimatedDelivery}
                    </p>
                  )}
                  <p className="mt-1">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Phone: </span>
                    {phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("delivery")}
                  className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400"
                >
                  Change delivery
                </button>
              </div>

              {/* Payment method */}
              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {/* Pay online */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      paymentMethod === "online"
                        ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Pay Online
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                      M-Pesa or Card via Paystack — secure &amp; instant
                    </p>
                  </button>

                  {/* Pay on delivery */}
                  {allowPOD && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pay-on-delivery")}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                        paymentMethod === "pay-on-delivery"
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                          : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Pay on{" "}
                        {deliveryMethod === "pickup" ? "Pickup" : "Delivery"}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        Pay with cash or M-Pesa when your order{" "}
                        {deliveryMethod === "pickup" ? "is collected" : "arrives"}
                        .
                      </p>
                      {depositAmount > 0 && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          A deposit of {podDepositPercent}% (
                          {formatPrice(depositAmount)}) is required to confirm.
                          The remaining {formatPrice(total - depositAmount)} is
                          paid {deliveryMethod === "pickup" ? "at pickup" : "on delivery"}.
                        </p>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("delivery")}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={
                    paymentMethod === "online"
                      ? handlePayOnline
                      : handlePayOnDelivery
                  }
                  className="flex-1"
                  disabled={isPending || hasStockIssues || stockLoading}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : paymentMethod === "online" ? (
                    <>Pay {formatPrice(total)}</>
                  ) : depositAmount > 0 ? (
                    <>Pay Deposit {formatPrice(depositAmount)}</>
                  ) : (
                    <>Confirm Order</>
                  )}
                </Button>
              </div>

              {paymentMethod === "online" && (
                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                  You&apos;ll be redirected to Paystack&apos;s secure checkout
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Summary ({totalItems} {totalItems === 1 ? "item" : "items"})
            </h2>

            <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((item) => {
                const stockInfo = stockMap.get(item.productId);
                const hasIssue =
                  stockInfo?.isOutOfStock || stockInfo?.exceedsStock;

                return (
                  <div key={item.productId} className="flex gap-3 py-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Qty: {item.quantity}
                      </p>
                      {hasIssue && (
                        <p className="text-xs font-medium text-red-600">
                          {stockInfo?.isOutOfStock
                            ? "Out of stock"
                            : `Only ${stockInfo?.currentStock} left`}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Delivery</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {deliveryMethod === "pickup" ? (
                    <span className="font-medium text-green-600">Free</span>
                  ) : !selectedArea ? (
                    <span className="text-zinc-400">Select area</span>
                  ) : isFreeDelivery(settings, subtotal, selectedArea.zoneId) ? (
                    <span className="font-medium text-green-600">Free</span>
                  ) : (
                    formatPrice(effectiveDeliveryFee)
                  )}
                </span>
              </div>

              {settings?.freeDeliveryThreshold && deliveryMethod === "delivery" && selectedArea && !isFreeDelivery(settings, subtotal, selectedArea.zoneId) && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Free delivery on orders over{" "}
                  {formatPrice(settings.freeDeliveryThreshold)}
                </p>
              )}

              <div className="flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Total
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
