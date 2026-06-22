import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { formatPrice } from "@/lib/utils";

interface CategoryProduct {
  _id: string;
  name: string | null;
  slug: string | null;
  price: number | null;
  stock: number | null;
  images: { _key?: string | null; asset?: { _id: string; url: string | null } | null }[] | null;
  category: { _id: string; title: string | null; slug: string | null } | null;
}

interface CategorySectionProps {
  title: string;
  icon?: string | null;
  slug: string;
  products: CategoryProduct[];
}

function MiniProductCard({ product }: { product: CategoryProduct }) {
  const imageUrl = product.images?.[0]?.asset?.url;
  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;

  return (
    <div className="group flex w-40 flex-shrink-0 flex-col sm:w-48 md:w-52">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name ?? "Product"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 208px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70 dark:bg-zinc-900/70">
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-2.5 space-y-1.5 px-0.5">
        <Link href={`/products/${product.slug}`}>
          <p className="line-clamp-2 text-sm font-medium leading-tight text-zinc-800 hover:text-zinc-600 dark:text-zinc-200 dark:hover:text-zinc-400">
            {product.name}
          </p>
        </Link>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatPrice(product.price)}
        </p>
        {!isOutOfStock && (
          <AddToCartButton
            productId={product._id}
            name={product.name ?? "Product"}
            price={product.price ?? 0}
            image={imageUrl ?? undefined}
            stock={stock}
            className="h-9 text-xs"
          />
        )}
      </div>
    </div>
  );
}

export function CategorySection({ title, icon, slug, products }: CategorySectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h2>
          <Link
            href={`/shop/${slug}`}
            className="flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Horizontal product row */}
        <div className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide">
          {products.map((product) => (
            <MiniProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
