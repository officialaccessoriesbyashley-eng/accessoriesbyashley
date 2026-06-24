export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const q = quality ?? 75;

  // Sanity CDN — let their image pipeline resize & format
  if (src.startsWith("https://cdn.sanity.io")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(q));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }

  // Unsplash CDN — also supports query-string transforms
  if (src.startsWith("https://images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(q));
    url.searchParams.set("fm", "webp");
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  return src;
}
