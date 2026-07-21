import { adminClient } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import { Phone, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ADMIN_CUSTOMERS_QUERY = defineQuery(`*[_type == "customer"] | order(createdAt desc) {
  _id,
  name,
  email,
  phone,
  whatsappNumber,
  defaultDeliveryMethod,
  createdAt,
  "addressCount": count(savedAddresses),
  "orderCount": count(*[_type == "order" && customer.email == ^.email])
}`);

interface Customer {
  _id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  defaultDeliveryMethod: "pickup" | "delivery" | null;
  createdAt: string | null;
  addressCount: number | null;
  orderCount: number | null;
}

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await adminClient.fetch<Customer[]>(ADMIN_CUSTOMERS_QUERY);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Customers</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {customers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No customers yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {customers.map((c) => (
              <li key={c._id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {c.name ? c.name[0].toUpperCase() : c.email?.[0].toUpperCase() ?? "?"}
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {c.name ?? <span className="text-zinc-400 italic">No name</span>}
                    </span>
                    {c.defaultDeliveryMethod && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {c.defaultDeliveryMethod}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{c.email}</p>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                    )}
                    {c.addressCount != null && c.addressCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {c.addressCount} saved address{c.addressCount !== 1 ? "es" : ""}
                      </span>
                    )}
                    {c.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(c.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Orders badge */}
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {c.orderCount ?? 0} order{c.orderCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
