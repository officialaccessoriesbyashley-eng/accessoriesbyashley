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
  PlusCircle,
  Globe,
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
  ComboboxSeparator,
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliveryOption {
  method: string;
  fee: number;
}

interface Zone {
  _id: string;
  name: string;
  zoneNumber: number;
  deliveryType: string;
  estimatedDelivery: string;
  allowPayOnDelivery: boolean;
}

interface Area {
  _id: string;
  name: string;
  subZone?: string;
  deliveryOptions: DeliveryOption[];
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
type DeliveryService =
  | "supermetro"
  | "matatu"
  | "pickup-mtaani"
  | "bolt"
  | "courier-company"
  | "bus-parcel"
  | "";

type CustomRegion = "nairobi" | "outside-nairobi" | "outside-kenya" | "";

// ── Constants ──────────────────────────────────────────────────────────────────

const SUPERMETRO_ROUTES = [
  "Thika", "Kikuyu", "Ruiru", "Juja", "Makongeni",
  "Ngong", "Kitengela", "Kamulu", "Joska",
];

const METHOD_LABELS: Record<string, string> = {
  matatu: "Matatu Parcel",
  supermetro: "Supermetro",
  "pickup-mtaani": "Pick up Mtaani",
  bolt: "Bolt Delivery",
  "courier-company": "Courier Company",
  "bus-parcel": "Bus / SGR Parcel",
};

const METHOD_DESCRIPTIONS: Record<string, string> = {
  matatu: "Any preferred matatu parcel delivery — indicate the name.",
  supermetro: SUPERMETRO_ROUTES.join(" · "),
  "pickup-mtaani": "Indicate your location and preferred drop-off station.",
  bolt: "Indicate your pin drop-off location and recipient details.",
  "courier-company": "DHL, Aramex, Skynet, G4S, FedEx, etc.",
  "bus-parcel": "Modern Coast, Easy Coach, SGR Madaraka, etc.",
};

const CUSTOM_AREA_INFO: Record<Exclude<CustomRegion, "">, { label: string; fee: number; estimatedDelivery: string; methods: DeliveryService[] }> = {
  "nairobi": {
    label: "Greater Nairobi",
    fee: 450,
    estimatedDelivery: "1–2 business days",
    methods: ["matatu", "pickup-mtaani", "bolt"],
  },
  "outside-nairobi": {
    label: "Outside Nairobi (Kenya)",
    fee: 600,
    estimatedDelivery: "3–5 business days",
    methods: ["courier-company", "bus-parcel"],
  },
  "outside-kenya": {
    label: "Outside Kenya",
    fee: 1500,
    estimatedDelivery: "7–14 business days",
    methods: ["courier-company", "bus-parcel"],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function isSupermetroArea(areaName: string): boolean {
  const name = areaName.toLowerCase();
  return SUPERMETRO_ROUTES.some((r) => name.includes(r.toLowerCase()));
}

function isFreeDelivery(settings: DeliverySettings | null, subtotal: number, zoneId: string | undefined): boolean {
  if (!settings?.freeDeliveryThreshold || !zoneId) return false;
  if (subtotal < settings.freeDeliveryThreshold) return false;
  return settings.freeDeliveryZones?.some((z) => z._id === zoneId) ?? false;
}

function minFee(options: DeliveryOption[]): number | null {
  if (!options || options.length === 0) return null;
  return Math.min(...options.map((o) => o.fee));
}

// ── Step indicator ─────────────────────────────────────────────────────────────

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
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${done || active ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border-2 border-zinc-300 text-zinc-400 dark:border-zinc-700"}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-5 h-px w-12 sm:w-20 ${done ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Service option card ────────────────────────────────────────────────────────

function ServiceOption({
  number, label, description, fee, active, onClick, children,
}: {
  number: number; label: string; description: string; fee?: number;
  active: boolean; onClick: () => void; children?: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${active ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{number}. {label}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
          {fee !== undefined && (
            <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {formatPrice(fee)}
            </span>
          )}
        </div>
      </button>
      {active && children && <div className="mt-2 space-y-3 px-1">{children}</div>}
    </div>
  );
}

// ── Bolt fields ────────────────────────────────────────────────────────────────

function BoltFields({ boltPinLocation, setBoltPinLocation, boltRecipientName, setBoltRecipientName, boltRecipientContact, setBoltRecipientContact }: {
  boltPinLocation: string; setBoltPinLocation: (v: string) => void;
  boltRecipientName: string; setBoltRecipientName: (v: string) => void;
  boltRecipientContact: string; setBoltRecipientContact: (v: string) => void;
}) {
  return (
    <>
      <LocationPicker value={boltPinLocation} onChange={setBoltPinLocation} label="Pin your drop-off location" />
      <div>
        <Label htmlFor="boltRecipientName">Recipient name</Label>
        <Input id="boltRecipientName" value={boltRecipientName} onChange={(e) => setBoltRecipientName(e.target.value)} placeholder="Full name of person receiving" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="boltRecipientContact">Recipient contact</Label>
        <Input id="boltRecipientContact" type="tel" value={boltRecipientContact} onChange={(e) => setBoltRecipientContact(e.target.value)} placeholder="+254 7XX XXX XXX" className="mt-1" />
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CheckoutClient({ zones, areas, settings, pickupStation }: CheckoutClientProps) {
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

  // Custom area
  const [customAreaName, setCustomAreaName] = useState("");
  const [customAreaRegion, setCustomAreaRegion] = useState<CustomRegion>("");

  // Delivery service details
  const [deliveryService, setDeliveryService] = useState<DeliveryService>("");
  const [supermetroRoute, setSupermetroRoute] = useState("");
  const [otherMatatuName, setOtherMatatuName] = useState("");
  const [pickupMtaaniDetails, setPickupMtaaniDetails] = useState("");
  const [pickupMtaaniPin, setPickupMtaaniPin] = useState("");
  const [boltPinLocation, setBoltPinLocation] = useState("");
  const [boltRecipientName, setBoltRecipientName] = useState("");
  const [boltRecipientContact, setBoltRecipientContact] = useState("");
  const [courierCompanyName, setCourierCompanyName] = useState("");
  const [busParcelServiceName, setBusParcelServiceName] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"online" | "pay-on-delivery">("online");

  const selectedArea = useMemo(() => areas.find((a) => a._id === selectedAreaId), [areas, selectedAreaId]);
  const isCustom = selectedAreaId === "__custom__";

  // Available delivery methods — driven by the area's deliveryOptions
  const availableMethods: DeliveryOption[] = useMemo(() => {
    if (isCustom && customAreaRegion) {
      const info = CUSTOM_AREA_INFO[customAreaRegion as Exclude<CustomRegion, "">];
      return info.methods.map((m) => ({ method: m, fee: info.fee }));
    }
    if (selectedArea) {
      return (selectedArea.deliveryOptions ?? []).filter((o) =>
        o.method !== "supermetro" || isSupermetroArea(selectedArea.name)
      );
    }
    return [];
  }, [isCustom, customAreaRegion, selectedArea]);

  const isCourierZone = availableMethods.length > 0 &&
    availableMethods.every((o) => o.method === "courier-company" || o.method === "bus-parcel");
  const isOutsideKenya = isCustom
    ? customAreaRegion === "outside-kenya"
    : (selectedArea?.zoneNumber ?? 0) >= 5;

  const serviceVisible = isCustom ? !!customAreaRegion : !!selectedAreaId;

  // Fee for the currently selected method
  const selectedMethodFee = useMemo<number | null>(() => {
    if (!deliveryService) return null;
    if (isCustom && customAreaRegion) {
      return CUSTOM_AREA_INFO[customAreaRegion as Exclude<CustomRegion, "">]?.fee ?? null;
    }
    return selectedArea?.deliveryOptions.find((o) => o.method === deliveryService)?.fee ?? null;
  }, [deliveryService, isCustom, customAreaRegion, selectedArea]);

  const effectiveDeliveryFee = useMemo(() => {
    if (deliveryMethod === "pickup") return 0;
    if (selectedMethodFee == null) return 0;
    if (!isCustom && selectedArea && isFreeDelivery(settings, subtotal, selectedArea.zoneId)) return 0;
    return selectedMethodFee;
  }, [deliveryMethod, selectedMethodFee, isCustom, selectedArea, settings, subtotal]);

  const effectiveEstimatedDelivery = useMemo(() => {
    if (isCustom && customAreaRegion) return CUSTOM_AREA_INFO[customAreaRegion as Exclude<CustomRegion, "">]?.estimatedDelivery;
    return selectedArea?.estimatedDelivery;
  }, [isCustom, customAreaRegion, selectedArea]);

  const total = subtotal + effectiveDeliveryFee;
  const allowPOD = deliveryMethod === "pickup";
  const podDepositPercent = settings?.payOnDeliveryDepositPercent ?? 0;
  const depositAmount = podDepositPercent > 0 ? Math.round((total * podDepositPercent) / 100) : 0;

  const groupedAreas = useMemo(() => {
    const groups: Record<string, { zoneName: string; zoneNumber: number; subZone: string; items: Area[] }> = {};
    for (const area of areas) {
      const key = `${area.zoneId}::${area.subZone ?? ""}`;
      if (!groups[key]) {
        groups[key] = { zoneName: area.zoneName, zoneNumber: area.zoneNumber, subZone: area.subZone ?? "", items: [] };
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
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Your cart is empty</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Add some items before checking out.</p>
          <Button asChild className="mt-8"><Link href="/">Continue Shopping</Link></Button>
        </div>
      </div>
    );
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function canProceedFromContact() {
    return name.trim().length > 0 && phone.trim().length > 0;
  }

  function canProceedFromDelivery() {
    if (deliveryMethod === "pickup") return true;
    if (isCustom) {
      if (!customAreaName.trim() || !customAreaRegion) return false;
    } else {
      if (!selectedAreaId) return false;
    }
    if (!deliveryService) return false;
    if (deliveryService === "supermetro") return !!supermetroRoute;
    if (deliveryService === "matatu") return !!otherMatatuName.trim();
    if (deliveryService === "pickup-mtaani") return !!pickupMtaaniDetails.trim();
    if (deliveryService === "bolt") return !!boltPinLocation.trim() && !!boltRecipientName.trim() && !!boltRecipientContact.trim();
    if (deliveryService === "courier-company") return true; // courier name is optional
    if (deliveryService === "bus-parcel") return true; // bus name is optional
    return false;
  }

  function buildDeliveryServiceDetails(): string {
    const customSuffix = isCustom && customAreaName ? ` | Area: ${customAreaName}` : "";
    switch (deliveryService) {
      case "supermetro": return `Supermetro – ${supermetroRoute} route`;
      case "matatu": return `Matatu parcel – ${otherMatatuName}`;
      case "pickup-mtaani": return [
        `Pick up Mtaani – ${pickupMtaaniDetails}`,
        pickupMtaaniPin ? `Pin: ${pickupMtaaniPin}` : "",
      ].filter(Boolean).join(" | ");
      case "bolt": return `Bolt delivery | Drop-off: ${boltPinLocation} | Recipient: ${boltRecipientName} (${boltRecipientContact})`;
      case "courier-company": return `Courier: ${courierCompanyName || "any"}${customSuffix}`;
      case "bus-parcel": return `Bus/SGR Parcel: ${busParcelServiceName || "any"}${customSuffix}`;
      default: return "";
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleContactNext() {
    if (!canProceedFromContact()) { setError("Please enter your name and phone number."); return; }
    setError(null);
    setStep("delivery");
  }

  function handleDeliveryNext() {
    if (!canProceedFromDelivery()) { setError("Please complete your delivery details."); return; }
    setError(null);
    setStep("payment");
  }

  function buildDeliveryInfo(): DeliveryInfo {
    const customRegionLabel = isCustom && customAreaRegion
      ? CUSTOM_AREA_INFO[customAreaRegion as Exclude<CustomRegion, "">]?.label
      : undefined;
    return {
      method: deliveryMethod,
      zoneId: deliveryMethod === "pickup"
        ? zones.find((z) => z.zoneNumber === 0)?._id
        : isCustom ? undefined : selectedArea?.zoneId,
      areaId: deliveryMethod === "delivery" && !isCustom ? selectedAreaId : undefined,
      deliveryFee: effectiveDeliveryFee,
      deliveryServiceType: deliveryMethod === "delivery" ? deliveryService : undefined,
      deliveryServiceDetails: deliveryMethod === "delivery"
        ? isCustom
          ? `Custom area: ${customAreaName} (${customRegionLabel ?? customAreaRegion}) | ${buildDeliveryServiceDetails()}`
          : buildDeliveryServiceDetails()
        : undefined,
      customerPhone: phone,
      customerWhatsapp: effectiveWhatsapp,
    };
  }

  function handlePayOnline() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(items, buildDeliveryInfo());
      if (result.success && result.url) { window.location.href = result.url; }
      else { setError(result.error ?? "Something went wrong. Please try again."); }
    });
  }

  function handlePayOnDelivery() {
    setError(null);
    startTransition(async () => {
      const result = await createPayOnDeliveryOrder(items, buildDeliveryInfo());
      if (result.success) { window.location.href = "/checkout/success?pod=1"; }
      else { setError(result.error ?? "Something went wrong. Please try again."); }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const station = pickupStation ?? settings?.defaultPickupStation ?? null;
  const deliveryAreaLabel = isCustom ? customAreaName || "your custom area" : selectedArea?.name ?? "your address";
  const customRegionInfo = isCustom && customAreaRegion ? CUSTOM_AREA_INFO[customAreaRegion as Exclude<CustomRegion, "">] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Checkout</h1>
        <div className="mt-6"><Stepper current={step} /></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left — form */}
        <div className="lg:col-span-3 space-y-6">
          {hasStockIssues && !stockLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Some items have stock issues. Please update your cart.</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {settings?.deliveryNotice && step === "delivery" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
              {settings.deliveryNotice}
            </div>
          )}

          {/* ── STEP 1: CONTACT ───────────────────────────────────────── */}
          {step === "contact" && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-3.5 w-3.5" />Phone Number
                  </Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="sameAsPhone" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                    <Label htmlFor="sameAsPhone" className="cursor-pointer font-normal">WhatsApp is the same number</Label>
                  </div>
                  {!sameAsPhone && (
                    <Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" className="mt-2" />
                  )}
                </div>
              </div>
              <Button onClick={handleContactNext} className="mt-6 w-full" disabled={!canProceedFromContact()}>
                Continue to Delivery <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: DELIVERY ──────────────────────────────────────── */}
          {step === "delivery" && (
            <div className="space-y-4">
              {/* Pickup card */}
              <button type="button" onClick={() => setDeliveryMethod("pickup")} className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${deliveryMethod === "pickup" ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"}`}>
                <div className="flex items-start gap-3">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Free Pickup — Nairobi CBD</p>
                    {station && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{station.address}{station.landmark && ` · Near ${station.landmark}`}</p>}
                    {station?.operatingHours && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{station.operatingHours}</p>}
                    <Badge variant="outline" className="mt-2 text-xs">Ready in 2 hours · Free</Badge>
                  </div>
                </div>
              </button>

              {/* Delivery card */}
              <button type="button" onClick={() => { setDeliveryMethod("delivery"); setPaymentMethod("online"); }} className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${deliveryMethod === "delivery" ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"}`}>
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600 dark:text-zinc-400" />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Deliver to me</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Nairobi · Outside Nairobi · Outside Kenya</p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Matatu · Supermetro · Pick up Mtaani · Bolt · Courier · Bus/SGR Parcel</p>
                  </div>
                </div>
              </button>

              {/* Delivery form */}
              {deliveryMethod === "delivery" && (
                <div className="space-y-4">
                  {/* Area selector */}
                  <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                    <Label>
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />Your Area / Estate
                    </Label>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Type to search — fees update when you pick a delivery method</p>

                    <Combobox
                      value={selectedAreaId}
                      onValueChange={(val) => {
                        const v = val as string;
                        setSelectedAreaId(v);
                        setDeliveryService("");
                        setCourierCompanyName("");
                        setBusParcelServiceName("");
                        if (v !== "__custom__") { setCustomAreaName(""); setCustomAreaRegion(""); }
                      }}
                    >
                      <ComboboxInput placeholder="Search area… e.g. Westlands, Karen, Mombasa" showClear={!!selectedAreaId} className="mt-2 w-full" />
                      <ComboboxContent className="w-full">
                        <ComboboxEmpty>
                          No areas found.{" "}
                          <button className="underline" onClick={() => { setSelectedAreaId("__custom__"); setDeliveryService(""); }}>
                            Add your area
                          </button>
                        </ComboboxEmpty>
                        <ComboboxList>
                          {groupedAreas.map((group) => (
                            <ComboboxGroup key={`${group.zoneName}::${group.subZone}`}>
                              <ComboboxLabel>
                                {group.subZone ? `Zone ${group.zoneNumber} › ${group.subZone}` : `Zone ${group.zoneNumber}: ${group.zoneName}`}
                              </ComboboxLabel>
                              {group.items.map((area: Area) => {
                                const from = minFee(area.deliveryOptions);
                                return (
                                  <ComboboxItem key={area._id} value={area._id}>
                                    <span className="flex-1">{area.name}</span>
                                    {from != null && (
                                      <span className="ml-auto text-xs text-zinc-400">from {formatPrice(from)}</span>
                                    )}
                                  </ComboboxItem>
                                );
                              })}
                            </ComboboxGroup>
                          ))}
                          <ComboboxSeparator />
                          <ComboboxGroup>
                            <ComboboxItem value="__custom__" className="text-zinc-500 dark:text-zinc-400">
                              <PlusCircle className="h-4 w-4 shrink-0 text-zinc-400" />
                              <span>My area isn&apos;t listed — add it here</span>
                            </ComboboxItem>
                          </ComboboxGroup>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>

                    {selectedArea && !isCustom && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        Estimated delivery: <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedArea.estimatedDelivery}</span>
                      </p>
                    )}

                    {/* Custom area form */}
                    {isCustom && (
                      <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
                        <div className="mb-3 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-zinc-400" />
                          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Tell us where you are — we&apos;ll confirm the exact fee via WhatsApp
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="customAreaName">Your area / town / city</Label>
                            <Input id="customAreaName" value={customAreaName} onChange={(e) => setCustomAreaName(e.target.value)} placeholder="e.g. Naivasha, Garissa, Kampala…" className="mt-1" />
                          </div>
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">Where is your location?</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {(["nairobi", "outside-nairobi", "outside-kenya"] as const).map((region) => {
                                const info = CUSTOM_AREA_INFO[region];
                                return (
                                  <button
                                    key={region}
                                    type="button"
                                    onClick={() => { setCustomAreaRegion(region); setDeliveryService(""); }}
                                    className={`rounded-lg border-2 p-3 text-left text-xs transition-colors ${customAreaRegion === region ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-800" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"}`}
                                  >
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{info.label}</p>
                                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">from {formatPrice(info.fee)}</p>
                                    <p className="mt-0.5 text-zinc-400 dark:text-zinc-500">{info.estimatedDelivery}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {customAreaRegion && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Estimated delivery: <span className="font-medium text-zinc-700 dark:text-zinc-300">{customRegionInfo?.estimatedDelivery}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Delivery method options — data-driven from area.deliveryOptions ── */}
                  {serviceVisible && availableMethods.length > 0 && (
                    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 space-y-3">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">How should we deliver it?</h3>

                      {isOutsideKenya && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                          <Globe className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">International shipping</p>
                            <p className="mt-0.5">We&apos;ll confirm the exact delivery fee and timeline via WhatsApp before dispatch.</p>
                          </div>
                        </div>
                      )}

                      {availableMethods.map((opt, i) => {
                        const method = opt.method as DeliveryService;
                        const isActive = deliveryService === method;

                        return (
                          <ServiceOption
                            key={method}
                            number={i + 1}
                            label={METHOD_LABELS[method] ?? method}
                            description={METHOD_DESCRIPTIONS[method] ?? ""}
                            fee={opt.fee}
                            active={isActive}
                            onClick={() => setDeliveryService(method)}
                          >
                            {method === "supermetro" && (
                              <div>
                                <Label htmlFor="supermetroRoute">Select your route</Label>
                                <select id="supermetroRoute" value={supermetroRoute} onChange={(e) => setSupermetroRoute(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                                  <option value="">— Pick a route —</option>
                                  {SUPERMETRO_ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                            )}
                            {method === "matatu" && (
                              <div>
                                <Label htmlFor="matatuName">Matatu / sacco name</Label>
                                <Input id="matatuName" value={otherMatatuName} onChange={(e) => setOtherMatatuName(e.target.value)} placeholder="e.g. KBS Route 58, Citi Hoppa, 2NK…" className="mt-1" />
                              </div>
                            )}
                            {method === "pickup-mtaani" && (
                              <>
                                <div>
                                  <Label htmlFor="pickupMtaani">Location &amp; preferred drop-off station</Label>
                                  <Textarea id="pickupMtaani" value={pickupMtaaniDetails} onChange={(e) => setPickupMtaaniDetails(e.target.value)} placeholder="e.g. Westlands stage, near Total petrol station — drop at Posta Kenya counter" rows={2} className="mt-1" />
                                </div>
                                <LocationPicker value={pickupMtaaniPin} onChange={setPickupMtaaniPin} label="Pin your drop-off location (optional)" />
                              </>
                            )}
                            {method === "bolt" && (
                              <BoltFields {...{ boltPinLocation, setBoltPinLocation, boltRecipientName, setBoltRecipientName, boltRecipientContact, setBoltRecipientContact }} />
                            )}
                            {method === "courier-company" && (
                              <div>
                                <Label htmlFor="courierCompany">Preferred courier company</Label>
                                <Input id="courierCompany" value={courierCompanyName} onChange={(e) => setCourierCompanyName(e.target.value)} placeholder="e.g. DHL, Aramex, Skynet, G4S… (leave blank for any)" className="mt-1" />
                              </div>
                            )}
                            {method === "bus-parcel" && (
                              <div>
                                <Label htmlFor="busParcel">Preferred bus / parcel service</Label>
                                <Input id="busParcel" value={busParcelServiceName} onChange={(e) => setBusParcelServiceName(e.target.value)} placeholder="e.g. Modern Coast, Easy Coach, SGR… (leave blank for any)" className="mt-1" />
                              </div>
                            )}
                          </ServiceOption>
                        );
                      })}

                      {/* Fee update hint */}
                      {deliveryService && selectedMethodFee != null && !isCourierZone && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Delivery fee for this method:{" "}
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatPrice(selectedMethodFee)}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pickup station details */}
              {deliveryMethod === "pickup" && station && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 text-sm space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{station.name}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">{station.address}</p>
                  {station.operatingHours && <p className="text-zinc-500">{station.operatingHours}</p>}
                  {station.googleMapsLink && (
                    <a href={station.googleMapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                      <MapPin className="h-3 w-3" /> View on Google Maps
                    </a>
                  )}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    We&apos;ll WhatsApp you at <span className="font-medium">{phone}</span> when your order is ready.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("contact")} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleDeliveryNext} className="flex-1" disabled={!canProceedFromDelivery()}>
                  Review Order <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: PAYMENT ───────────────────────────────────────── */}
          {step === "payment" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Delivery Summary</h2>
                <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">Method: </span>
                    {deliveryMethod === "pickup" ? `Pickup — ${station?.name ?? "CBD Station"}` : `Delivery to ${deliveryAreaLabel}`}
                    {isCustom && customAreaRegion && <span className="ml-1 text-xs text-zinc-400">({customRegionInfo?.label})</span>}
                  </p>
                  {deliveryMethod === "delivery" && deliveryService && (
                    <p>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">Via: </span>
                      {buildDeliveryServiceDetails()}
                    </p>
                  )}
                  {deliveryMethod === "delivery" && effectiveEstimatedDelivery && (
                    <p>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">Est. delivery: </span>
                      {effectiveEstimatedDelivery}
                      {isCustom && <span className="ml-1 text-xs text-zinc-400">(exact fee confirmed via WhatsApp)</span>}
                    </p>
                  )}
                  <p className="mt-1"><span className="font-medium text-zinc-800 dark:text-zinc-200">Phone: </span>{phone}</p>
                </div>
                <button type="button" onClick={() => setStep("delivery")} className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400">Change delivery</button>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Payment Method</h2>
                <div className="space-y-3">
                  <button type="button" onClick={() => setPaymentMethod("online")} className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${paymentMethod === "online" ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"}`}>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Pay Online</p>
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">M-Pesa or Card via Paystack — secure &amp; instant</p>
                  </button>
                  {allowPOD && (
                    <button type="button" onClick={() => setPaymentMethod("pay-on-delivery")} className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${paymentMethod === "pay-on-delivery" ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"}`}>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">Pay on Pickup</p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Pay with cash or M-Pesa when you collect your order.</p>
                      {depositAmount > 0 && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          A deposit of {podDepositPercent}% ({formatPrice(depositAmount)}) is required. Remaining {formatPrice(total - depositAmount)} paid at pickup.
                        </p>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("delivery")} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={paymentMethod === "online" ? handlePayOnline : handlePayOnDelivery} className="flex-1" disabled={isPending || hasStockIssues || stockLoading}>
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                    : paymentMethod === "online" ? <>Pay {formatPrice(total)}</>
                    : depositAmount > 0 ? <>Pay Deposit {formatPrice(depositAmount)} · Collect &amp; Pay Rest</>
                    : <>Confirm Order — Pay on Pickup</>}
                </Button>
              </div>
              {paymentMethod === "online" && (
                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">You&apos;ll be redirected to Paystack&apos;s secure checkout</p>
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
                const hasIssue = stockInfo?.isOutOfStock || stockInfo?.exceedsStock;
                return (
                  <div key={item.productId} className="flex gap-3 py-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" /> : null}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Qty: {item.quantity}</p>
                      {hasIssue && (
                        <p className="text-xs font-medium text-red-600">
                          {stockInfo?.isOutOfStock ? "Out of stock" : `Only ${stockInfo?.currentStock} left`}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="text-zinc-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Delivery</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {deliveryMethod === "pickup" ? (
                    <span className="font-medium text-green-600">Free</span>
                  ) : !serviceVisible ? (
                    <span className="text-zinc-400">Select area</span>
                  ) : !deliveryService ? (
                    <span className="text-zinc-400">Select method</span>
                  ) : isCustom ? (
                    <span>{formatPrice(effectiveDeliveryFee)} <span className="text-xs text-zinc-400">(est.)</span></span>
                  ) : !isCustom && selectedArea && isFreeDelivery(settings, subtotal, selectedArea.zoneId) ? (
                    <span className="font-medium text-green-600">Free</span>
                  ) : (
                    formatPrice(effectiveDeliveryFee)
                  )}
                </span>
              </div>
              {settings?.freeDeliveryThreshold && deliveryMethod === "delivery" && selectedArea && !isCustom && !isFreeDelivery(settings, subtotal, selectedArea.zoneId) && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Free delivery on orders over {formatPrice(settings.freeDeliveryThreshold)}
                </p>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(total)}
                  {isCustom && customAreaRegion && (
                    <span className="ml-1 block text-right text-xs font-normal text-zinc-400">(delivery est.)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
