// Renders a <script type="application/ld+json"> tag for Schema.org structured data.
// Use server-side only — never import in client components.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data is server-generated, not user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ── Schema builders ───────────────────────────────────────────────────────────

const SITE_URL = "https://accessoriesbyashley.com";
const BRAND_NAME = "Accessories by Ashley";

interface ProductJsonLdReview {
  _id: string;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string;
  customer?: { name?: string | null } | null;
}

interface ProductJsonLdProps {
  product: {
    name: string | null;
    slug: string | null;
    description?: string | null;
    price: number | null;
    stock?: number | null;
    material?: string | null;
    color?: string | null;
    seoDescription?: string | null;
    images?: { asset?: { url?: string | null } | null }[] | null;
    category?: { title?: string | null; slug?: string | null } | null;
    subcategory?: { title?: string | null } | null;
  };
  reviewStats?: { averageRating?: number | null; totalReviews?: number | null } | null;
  reviews?: ProductJsonLdReview[] | null;
  lowestShippingFee?: number;
}

function reviewerName(name: string | null | undefined): string {
  if (!name) return "Customer";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function ProductJsonLd({ product, reviewStats, reviews, lowestShippingFee = 99 }: ProductJsonLdProps) {
  const imageUrls = (product.images ?? [])
    .map((img) => img.asset?.url)
    .filter(Boolean) as string[];

  const availability =
    (product.stock ?? 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const categoryPath = [
    product.category?.title,
    product.subcategory?.title,
  ]
    .filter(Boolean)
    .join(" > ");

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.description || undefined,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    brand: { "@type": "Brand", name: BRAND_NAME },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "KES",
      price: String(product.price ?? 0),
      availability,
      seller: { "@type": "Organization", name: BRAND_NAME },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "KE",
        },
        shippingRate: {
          "@type": "MonetaryAmount",
          value: String(lowestShippingFee),
          currency: "KES",
        },
      },
    },
  };

  if (categoryPath) data.category = categoryPath;
  if (product.material) data.material = product.material;
  if (product.color) data.color = product.color;

  const totalReviews = reviewStats?.totalReviews ?? 0;
  const avgRating = reviewStats?.averageRating ?? 0;

  if (totalReviews > 0 && avgRating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: totalReviews,
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (reviews && reviews.length > 0) {
    data.review = reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Person",
        name: reviewerName(r.customer?.name),
      },
      datePublished: r.createdAt.slice(0, 10),
      name: r.title || undefined,
      reviewBody: r.body,
    }));
  }

  return <JsonLd data={data} />;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

interface CategoryJsonLdProps {
  category: {
    title?: string | null;
    slug?: string | null;
    description?: string | null;
    seoDescription?: string | null;
  };
  productUrls?: string[];
}

export function CategoryJsonLd({ category, productUrls = [] }: CategoryJsonLdProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: category.title,
        description: category.seoDescription || category.description || undefined,
        url: `${SITE_URL}/shop/${category.slug}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: productUrls.length,
          itemListElement: productUrls.slice(0, 10).map((url, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url,
          })),
        },
      }}
    />
  );
}

interface OrganizationJsonLdProps {
  settings?: {
    siteName?: string | null;
    siteUrl?: string | null;
    organizationSchema?: {
      name?: string | null;
      description?: string | null;
      logoUrl?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      socialLinks?: { platform?: string | null; url?: string | null }[] | null;
    } | null;
  } | null;
}

export function OrganizationJsonLd({ settings }: OrganizationJsonLdProps) {
  const org = settings?.organizationSchema;
  const siteUrl = settings?.siteUrl ?? SITE_URL;
  const siteName = settings?.siteName ?? BRAND_NAME;
  const socialUrls = (org?.socialLinks ?? [])
    .map((l) => l.url)
    .filter(Boolean) as string[];

  return (
    <JsonLd
      data={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: org?.name ?? siteName,
          url: siteUrl,
          logo: org?.logoUrl ?? undefined,
          description: org?.description ?? undefined,
          contactPoint: org?.phone
            ? {
                "@type": "ContactPoint",
                telephone: org.phone,
                contactType: "customer service",
                availableLanguage: ["English", "Swahili"],
              }
            : undefined,
          address: org?.address
            ? {
                "@type": "PostalAddress",
                streetAddress: org.address,
                addressLocality: "Nairobi",
                addressCountry: "KE",
              }
            : {
                "@type": "PostalAddress",
                addressLocality: "Nairobi",
                addressCountry: "KE",
              },
          sameAs: socialUrls.length > 0 ? socialUrls : undefined,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: siteUrl,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ]}
    />
  );
}
