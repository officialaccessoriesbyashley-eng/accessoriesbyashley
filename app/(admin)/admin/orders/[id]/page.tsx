"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDocumentProjection, type DocumentHandle } from "@sanity/sdk-react";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  ExternalLink,
  Edit2,
  Star,
  MessageCircle,
  Copy,
  CheckCheck,
  Phone,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusSelect,
  DeliveryEditor,
  PublishButton,
  RevertButton,
} from "@/components/admin";
import { formatPrice, formatDate } from "@/lib/utils";

const STORE_URL = "https://accessoriesbyashley.co.ke";

interface OrderDetailProjection {
  orderNumber: string;
  email: string;
  customerPhone: string | null;
  customerWhatsapp: string | null;
  total: number;
  status: string;
  deliveryStatus: string | null;
  reviewRequestSent: boolean | null;
  createdAt: string;
  stripePaymentId: string | null;
  deliveryMethod: "pickup" | "delivery" | null;
  deliveryFee: number | null;
  deliveryServiceType: string | null;
  deliveryServiceDetails: string | null;
  deliveryArea: {
    name: string | null;
    subZone: string | null;
  } | null;
  items: Array<{
    _key: string;
    quantity: number;
    priceAtPurchase: number;
    product: {
      _id: string;
      name: string;
      slug: string;
      image: {
        asset: {
          url: string;
        } | null;
      } | null;
    } | null;
  }>;
}

// ── Review request card ───────────────────────────────────────────────────────

function ReviewRequestCard({
  orderId,
  productSlugs,
  whatsapp,
  alreadySent,
}: {
  orderId: string;
  productSlugs: string[];
  whatsapp: string | null;
  alreadySent: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(alreadySent);
  const [copied, setCopied] = useState(false);

  if (productSlugs.length === 0) return null;

  const reviewLinks = productSlugs.map((slug) => `${STORE_URL}/products/${slug}?review=true`);
  const firstLink = reviewLinks[0];

  const waMessage = productSlugs.length === 1
    ? `Hi! Your order has been delivered 🎉 We'd love to hear what you think — leave a review here: ${firstLink}`
    : `Hi! Your order has been delivered 🎉 We'd love to hear what you think — leave a review for each item:\n${reviewLinks.join("\n")}`;

  const waPhone = whatsapp?.replace(/\D/g, "");
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(firstLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const markSent = () => {
    startTransition(async () => {
      await fetch("/api/reviews/request-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/10">
        <div className="flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-green-500" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Review request sent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-950/10">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Ask for a review?</h3>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-500 mb-3">
        Order delivered — send the customer a review request.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markSent}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Send via WhatsApp
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={markSent}
          disabled={isPending}
          className="text-xs text-amber-600 underline underline-offset-2 disabled:opacity-50 dark:text-amber-500"
        >
          Mark as sent
        </button>
      </div>
    </div>
  );
}

// ── Order detail ──────────────────────────────────────────────────────────────

function OrderDetailContent({ handle }: { handle: DocumentHandle }) {
  const { data } = useDocumentProjection<OrderDetailProjection>({
    ...handle,
    projection: `{
      orderNumber,
      email,
      customerPhone,
      customerWhatsapp,
      total,
      status,
      deliveryStatus,
      reviewRequestSent,
      createdAt,
      stripePaymentId,
      deliveryMethod,
      deliveryFee,
      deliveryServiceType,
      deliveryServiceDetails,
      "deliveryArea": deliveryArea->{
        name,
        subZone
      },
      items[]{
        _key,
        quantity,
        priceAtPurchase,
        product->{
          _id,
          name,
          "slug": slug.current,
          "image": images[0]{
            asset->{
              url
            }
          }
        }
      }
    }`,
  });

  if (!data) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Order {data.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(data.createdAt, "datetime")}
          </p>
        </div>

        {/* Status and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Status:
            </span>
            <Suspense fallback={<Skeleton className="h-10 w-[140px]" />}>
              <StatusSelect {...handle} />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <RevertButton {...handle} />
            </Suspense>
            <Suspense fallback={null}>
              <PublishButton {...handle} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* Order Items */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({data.items?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {data.items?.map((item) => (
                <div
                  key={item._key}
                  className="flex gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:h-20 sm:w-20">
                    {item.product?.image?.asset?.url ? (
                      <Image
                        src={item.product.image.asset.url}
                        alt={item.product.name ?? "Product"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-base">
                          {item.product?.name ?? "Unknown Product"}
                        </span>
                        {item.product?.slug && (
                          <Link
                            href={`/products/${item.product.slug}`}
                            target="_blank"
                            className="shrink-0 text-zinc-400 hover:text-zinc-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                        Qty: {item.quantity} ×{" "}
                        {formatPrice(item.priceAtPurchase)}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-base">
                      {formatPrice(
                        (item.priceAtPurchase ?? 0) * (item.quantity ?? 1),
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(data.total)}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {formatPrice(data.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Customer
              </h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="break-all text-zinc-900 dark:text-zinc-100">
                {data.email}
              </p>
              {data.customerPhone && (
                <p className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <a href={`tel:${data.customerPhone}`} className="hover:underline">
                    {data.customerPhone}
                  </a>
                </p>
              )}
              {data.customerWhatsapp && (
                <p className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <a
                    href={`https://wa.me/${data.customerWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {data.customerWhatsapp}
                  </a>
                </p>
              )}
              {data.stripePaymentId && (
                <p className="break-all text-xs text-zinc-500 dark:text-zinc-400">
                  Payment: {data.stripePaymentId}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Delivery
                </h2>
              </div>
              {data.deliveryMethod === "delivery" && (
                <Edit2 className="h-4 w-4 text-zinc-400" />
              )}
            </div>
            <div className="mt-4">
              <DeliveryEditor
                {...handle}
                deliveryMethod={data.deliveryMethod}
                deliveryAreaName={data.deliveryArea?.name}
                deliveryAreaSubZone={data.deliveryArea?.subZone}
                deliveryFee={data.deliveryFee}
                deliveryServiceType={data.deliveryServiceType}
                deliveryServiceDetails={data.deliveryServiceDetails}
              />
            </div>
          </div>

          {/* Review request */}
          {data.deliveryStatus != null &&
            ["delivered", "collected"].includes(data.deliveryStatus) && (
              <ReviewRequestCard
                orderId={handle.documentId}
                productSlugs={(data.items ?? [])
                  .map((i) => i.product?.slug)
                  .filter(Boolean) as string[]}
                whatsapp={data.customerWhatsapp}
                alreadySent={data.reviewRequestSent ?? false}
              />
            )}

          {/* Studio Link */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Advanced Editing
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              For additional changes, edit this order in Sanity Studio.
            </p>
            <Link
              href={`/studio/structure/order;${handle.documentId}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              Open in Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const handle: DocumentHandle = {
    documentId: id,
    documentType: "order",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order Detail */}
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent handle={handle} />
      </Suspense>
    </div>
  );
}
