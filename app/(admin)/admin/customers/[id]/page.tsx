import { notFound } from "next/navigation";
import Link from "next/link";
import { adminClient } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageCircle,
  Bell,
  BellOff,
  Package,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

// ── Queries ───────────────────────────────────────────────────────────────────

const CUSTOMER_DETAIL_QUERY = defineQuery(`*[_type == "customer" && _id == $id][0]{
  _id,
  name,
  email,
  phone,
  whatsappNumber,
  birthday,
  defaultDeliveryMethod,
  createdAt,
  whatsappOptInTransactional,
  whatsappOptInMarketing,
  emailOptIn,
  savedAddresses[]{
    _key,
    label,
    directions,
    buildingApartment,
    googleMapsLink,
    isDefault,
    deliveryArea->{
      _id,
      name,
      subZone,
      deliveryFee,
      "zoneName": zone->name
    }
  }
}`);

const CUSTOMER_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
  && customer._ref == $customerId
] | order(createdAt desc) {
  _id,
  orderNumber,
  status,
  total,
  createdAt,
  "itemCount": count(items),
  "itemNames": items[0..2][].product->name
}`);

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomerDetail {
  _id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  birthday: string | null;
  defaultDeliveryMethod: "pickup" | "delivery" | null;
  createdAt: string | null;
  whatsappOptInTransactional: boolean | null;
  whatsappOptInMarketing: boolean | null;
  emailOptIn: boolean | null;
  savedAddresses: {
    _key: string;
    label: string | null;
    directions: string | null;
    buildingApartment: string | null;
    googleMapsLink: string | null;
    isDefault: boolean | null;
    deliveryArea: {
      _id: string;
      name: string | null;
      subZone: string | null;
      deliveryFee: number | null;
      zoneName: string | null;
    } | null;
  }[] | null;
}

interface CustomerOrder {
  _id: string;
  orderNumber: string | null;
  status: string | null;
  total: number | null;
  createdAt: string | null;
  itemCount: number | null;
  itemNames: (string | null)[] | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400",
  paid: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
  shipped: "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400",
  delivered: "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400",
  cancelled: "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [customer, orders] = await Promise.all([
    adminClient.fetch<CustomerDetail | null>(CUSTOMER_DETAIL_QUERY, { id }),
    adminClient.fetch<CustomerOrder[]>(CUSTOMER_ORDERS_QUERY, { customerId: id }),
  ]);

  if (!customer) notFound();

  const initials = customer.name
    ? customer.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : customer.email?.[0].toUpperCase() ?? "?";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        All Customers
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {customer.name ?? <span className="italic text-zinc-400">No name set</span>}
          </h1>
          {customer.createdAt && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Customer since {new Date(customer.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Contact info */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Contact Information</h2>
            <dl className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Email</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{customer.email ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">Phone</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {customer.phone
                      ? <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
                      : <span className="text-zinc-400 italic">Not set</span>}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 shrink-0 text-zinc-400" />
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">WhatsApp</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {customer.whatsappNumber
                      ? <a href={`https://wa.me/${customer.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{customer.whatsappNumber}</a>
                      : <span className="text-zinc-400 italic">{customer.phone ? "Same as phone" : "Not set"}</span>}
                  </dd>
                </div>
              </div>
              {customer.birthday && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">Birthday</dt>
                    <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {new Date(customer.birthday).toLocaleDateString("en-KE", { day: "numeric", month: "long" })}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </section>

          {/* Saved addresses */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Saved Addresses
              {customer.savedAddresses && customer.savedAddresses.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-500">({customer.savedAddresses.length})</span>
              )}
            </h2>
            {customer.savedAddresses && customer.savedAddresses.length > 0 ? (
              <ul className="space-y-3">
                {customer.savedAddresses.map((addr) => (
                  <li key={addr._key} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{addr.label}</span>
                        {addr.isDefault && (
                          <Badge variant="outline" className="text-[10px]">Default</Badge>
                        )}
                      </div>
                      {addr.googleMapsLink && (
                        <a href={addr.googleMapsLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-0.5">
                          Map <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="ml-6 mt-1.5 space-y-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                      {addr.deliveryArea && (
                        <p>
                          {addr.deliveryArea.name}
                          {addr.deliveryArea.subZone && ` · ${addr.deliveryArea.subZone}`}
                          {addr.deliveryArea.deliveryFee != null && ` · ${formatPrice(addr.deliveryArea.deliveryFee)}`}
                        </p>
                      )}
                      {addr.buildingApartment && <p>{addr.buildingApartment}</p>}
                      {addr.directions && <p className="text-xs text-zinc-400">{addr.directions}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No saved addresses.</p>
            )}
          </section>

          {/* Orders */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Order History
              {orders.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-500">({orders.length})</span>
              )}
            </h2>
            {orders.length > 0 ? (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {orders.map((order) => (
                  <li key={order._id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="flex items-center justify-between gap-3 hover:opacity-80"
                    >
                      <div className="flex items-start gap-3">
                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {order.orderNumber ?? order._id.slice(-8)}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {order.itemNames?.filter(Boolean).slice(0, 2).join(", ")}
                            {(order.itemCount ?? 0) > 2 && ` +${(order.itemCount ?? 0) - 2} more`}
                          </p>
                          {order.createdAt && (
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {new Date(order.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.total != null ? formatPrice(order.total) : "—"}
                        </span>
                        {order.status && (
                          <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_COLORS[order.status] ?? ""}`}>
                            {order.status}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No orders yet.</p>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Delivery preference */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Delivery Preference</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">
              {customer.defaultDeliveryMethod ?? <span className="text-zinc-400 italic">Not set</span>}
            </p>
          </section>

          {/* Notification preferences */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h2>
            <ul className="space-y-2.5">
              <NotifRow
                label="WhatsApp order updates"
                active={customer.whatsappOptInTransactional ?? false}
              />
              <NotifRow
                label="WhatsApp promotions"
                active={customer.whatsappOptInMarketing ?? false}
              />
              <NotifRow
                label="Email notifications"
                active={customer.emailOptIn ?? false}
              />
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function NotifRow({ label, active }: { label: string; active: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {active
        ? <Bell className="h-3.5 w-3.5 text-green-500" />
        : <BellOff className="h-3.5 w-3.5 text-zinc-400" />}
      <span className={active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
        {label}
      </span>
    </li>
  );
}
