"use client";

import { useState, useTransition, useCallback, KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronLeft, Sparkles, Save, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSeoFields, type SeoSaveData } from "@/lib/actions/seo";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeoData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords?: string[] | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
  seoScore?: number | null;
  lastSeoGeneration?: string | null;
  aiGenerated?: boolean | null;
}

interface Props {
  documentId: string;
  documentType: "product" | "category" | "subcategory";
  name: string;
  slug: string;
  imageUrl?: string | null;
  images?: { _key: string; asset: { url: string } }[];
  seo?: SeoData | null;
  seoDescription?: string;
  imageAltTexts?: { _key: string; altText: string }[];
  socialCaption?: string;
  searchTags?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SITE_URL = "https://accessoriesbyashley.com";

function charClass(len: number, warn: number, max: number) {
  if (len > max) return "text-red-600 dark:text-red-400";
  if (len > warn) return "text-yellow-600 dark:text-yellow-500";
  return "text-zinc-400 dark:text-zinc-500";
}

function inputBase() {
  return "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500";
}

function scoreColor(score: number | null | undefined) {
  if (score == null) return { bar: "bg-zinc-200 dark:bg-zinc-700", text: "text-zinc-500 dark:text-zinc-400" };
  if (score >= 80) return { bar: "bg-green-500", text: "text-green-700 dark:text-green-400" };
  if (score >= 60) return { bar: "bg-yellow-400", text: "text-yellow-700 dark:text-yellow-400" };
  if (score >= 40) return { bar: "bg-orange-400", text: "text-orange-700 dark:text-orange-400" };
  return { bar: "bg-red-500", text: "text-red-700 dark:text-red-400" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, count, warn, max }: { children: React.ReactNode; count: number; warn: number; max: number }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{children}</label>
      <span className={`text-xs tabular-nums ${charClass(count, warn, max)}`}>
        {count}/{max}
      </span>
    </div>
  );
}

function TagsInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInput("");
    },
    [tags, onChange],
  );

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="min-h-[42px] cursor-text rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-800"
      onClick={() => document.getElementById(`tag-input-${placeholder}`)?.focus()}
    >
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={`tag-input-${placeholder}`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>
    </div>
  );
}

function SerpPreview({
  metaTitle,
  metaDescription,
  slug,
  documentType,
}: {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  documentType: string;
}) {
  const url =
    documentType === "product"
      ? `${SITE_URL}/products/${slug}`
      : `${SITE_URL}/shop/${slug}`;

  const displayUrl = url.replace("https://", "");
  const title = metaTitle || "— No meta title set —";
  const desc = metaDescription || "No meta description set.";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Google Preview
      </p>
      <div className="space-y-0.5">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{displayUrl}</p>
        <p
          className={`text-base font-medium leading-snug ${
            metaTitle ? "text-[#1a0dab] dark:text-[#8ab4f8]" : "italic text-zinc-400"
          }`}
        >
          {title.length > 60 ? title.slice(0, 60) + "…" : title}
        </p>
        <p
          className={`text-sm leading-snug ${
            metaDescription ? "text-zinc-600 dark:text-zinc-300" : "italic text-zinc-400"
          }`}
        >
          {desc.length > 160 ? desc.slice(0, 160) + "…" : desc}
        </p>
      </div>
    </div>
  );
}

function OgPreview({
  ogTitle,
  metaTitle,
  ogDescription,
  metaDescription,
  ogImageUrl,
  imageUrl,
  name,
}: {
  ogTitle: string;
  metaTitle: string;
  ogDescription: string;
  metaDescription: string;
  ogImageUrl?: string | null;
  imageUrl?: string | null;
  name: string;
}) {
  const title = ogTitle || metaTitle || name;
  const desc = ogDescription || metaDescription;
  const img = ogImageUrl || imageUrl;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Social Preview
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {img ? (
          <img src={img} alt="" className="aspect-[1.91/1] w-full object-cover" />
        ) : (
          <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <span className="text-xs text-zinc-400">No image</span>
          </div>
        )}
        <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs uppercase text-zinc-400">accessoriesbyashley.com</p>
          <p className={`mt-0.5 text-sm font-semibold leading-snug ${title ? "text-zinc-900 dark:text-zinc-100" : "italic text-zinc-400"}`}>
            {title || "— No title —"}
          </p>
          {desc && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{desc}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ score, lastGenerated, aiGenerated }: { score?: number | null; lastGenerated?: string | null; aiGenerated?: boolean | null }) {
  const { bar, text } = scoreColor(score);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        SEO Score
      </p>
      {score != null ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className={`text-4xl font-bold ${text}`}>{score}</span>
            <span className="text-xs text-zinc-400">/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${bar}`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs work" : "Poor"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-400 italic">No score yet — generate SEO to get a score.</p>
      )}
      {lastGenerated && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          {aiGenerated ? "AI generated" : "Last saved"}{" "}
          {new Date(lastGenerated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SeoEditorClient({
  documentId,
  documentType,
  name,
  slug,
  imageUrl,
  images = [],
  seo,
  seoDescription: initialSeoDesc = "",
  imageAltTexts: initialAltTexts = [],
  socialCaption: initialCaption = "",
  searchTags: initialSearchTags = [],
}: Props) {
  const [metaTitle, setMetaTitle] = useState(seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(seo?.metaDescription ?? "");
  const [ogTitle, setOgTitle] = useState(seo?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(seo?.ogDescription ?? "");
  const [focusKeyword, setFocusKeyword] = useState(seo?.focusKeyword ?? "");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(seo?.secondaryKeywords ?? []);
  const [canonicalUrl, setCanonicalUrl] = useState(seo?.canonicalUrl ?? "");
  const [noIndex, setNoIndex] = useState(seo?.noIndex ?? false);
  const [seoDescription, setSeoDescription] = useState(initialSeoDesc);
  const [altTexts, setAltTexts] = useState<string[]>(
    initialAltTexts.map((a) => a.altText)
  );
  const [socialCaption, setSocialCaption] = useState(initialCaption);
  const [searchTags, setSearchTags] = useState<string[]>(initialSearchTags);

  const [score, setScore] = useState(seo?.seoScore);
  const [lastGenerated, setLastGenerated] = useState(seo?.lastSeoGeneration);
  const [aiGenerated, setAiGenerated] = useState(seo?.aiGenerated);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isGenerating, startGenerate] = useTransition();
  const [captionCopied, setCaptionCopied] = useState(false);

  const handleSave = () => {
    setSaveError(null);
    startSave(async () => {
      setSaveStatus("saving");
      const payload: SeoSaveData = {
        metaTitle,
        metaDescription,
        ogTitle,
        ogDescription,
        focusKeyword,
        secondaryKeywords,
        canonicalUrl,
        noIndex,
        seoDescription,
        imageAltTexts: altTexts.map((altText, i) => ({
          _key: initialAltTexts[i]?._key ?? `alt-${i}-${Date.now()}`,
          altText,
        })),
        socialCaption,
        searchTags,
      };
      const result = await saveSeoFields(documentId, documentType, payload);
      if (result.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
        setSaveError(result.error ?? "Unknown error");
      }
    });
  };

  const handleGenerate = () => {
    startGenerate(async () => {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, documentId, regenerate: true }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        seoContent?: {
          metaTitle?: string;
          metaDescription?: string;
          ogTitle?: string;
          ogDescription?: string;
          focusKeyword?: string;
          secondaryKeywords?: string[];
          seoDescription?: string;
          imageAltTexts?: string[];
          socialCaption?: string;
          searchTags?: string[];
          seoScore?: number;
        };
      };

      if (data.success && data.seoContent) {
        const c = data.seoContent;
        if (c.metaTitle) setMetaTitle(c.metaTitle);
        if (c.metaDescription) setMetaDescription(c.metaDescription);
        if (c.ogTitle) setOgTitle(c.ogTitle);
        if (c.ogDescription) setOgDescription(c.ogDescription);
        if (c.focusKeyword) setFocusKeyword(c.focusKeyword);
        if (c.secondaryKeywords) setSecondaryKeywords(c.secondaryKeywords);
        if (c.seoDescription) setSeoDescription(c.seoDescription);
        if (documentType === "product") {
          if (c.imageAltTexts) setAltTexts(c.imageAltTexts.slice(0, images.length || 3));
          if (c.socialCaption) setSocialCaption(c.socialCaption);
          if (c.searchTags) setSearchTags(c.searchTags);
        }
        if (c.seoScore != null) setScore(c.seoScore);
        setLastGenerated(new Date().toISOString());
        setAiGenerated(true);
      }
    });
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(socialCaption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 1500);
  };

  const isProduct = documentType === "product";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/seo"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
            SEO Overview
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating || isSaving}
            className="gap-1.5"
          >
            <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-pulse" : ""}`} />
            {isGenerating ? "Generating…" : "Generate with AI"}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isGenerating}
            className="gap-1.5"
          >
            {saveStatus === "saved" ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isSaving ? "Saving…" : "Save"}
              </>
            )}
          </Button>
        </div>
      </div>

      {saveStatus === "error" && saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          Save failed: {saveError}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        {/* Left — previews */}
        <div className="space-y-4">
          <SerpPreview
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            slug={slug}
            documentType={documentType}
          />
          <OgPreview
            ogTitle={ogTitle}
            metaTitle={metaTitle}
            ogDescription={ogDescription}
            metaDescription={metaDescription}
            ogImageUrl={seo?.ogImageUrl}
            imageUrl={imageUrl}
            name={name}
          />
          <ScoreCard
            score={score}
            lastGenerated={lastGenerated}
            aiGenerated={aiGenerated}
          />
        </div>

        {/* Right — fields */}
        <div className="space-y-6">
          {/* Meta fields */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Meta Tags</h2>
            <div className="space-y-4">
              <div>
                <FieldLabel count={metaTitle.length} warn={50} max={60}>
                  Meta Title
                </FieldLabel>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={`${name} | Accessories by Ashley`}
                  className={inputBase()}
                />
              </div>

              <div>
                <FieldLabel count={metaDescription.length} warn={140} max={160}>
                  Meta Description
                </FieldLabel>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  placeholder="Compelling description that appears in Google search results…"
                  className={inputBase()}
                />
              </div>
            </div>
          </section>

          {/* Social / OG fields */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Social Sharing</h2>
            <div className="space-y-4">
              <div>
                <FieldLabel count={ogTitle.length} warn={50} max={60}>
                  OG Title
                </FieldLabel>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Defaults to meta title if empty"
                  className={inputBase()}
                />
              </div>

              <div>
                <FieldLabel count={ogDescription.length} warn={140} max={160}>
                  OG Description
                </FieldLabel>
                <textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  rows={2}
                  placeholder="Defaults to meta description if empty"
                  className={inputBase()}
                />
              </div>
            </div>
          </section>

          {/* Keywords */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Keywords</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Focus Keyword
                </label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="e.g. gold chain necklace Nairobi"
                  className={inputBase()}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Secondary Keywords
                  <span className="ml-1 font-normal text-zinc-400">(press Enter to add)</span>
                </label>
                <TagsInput
                  tags={secondaryKeywords}
                  onChange={setSecondaryKeywords}
                  placeholder="Type a keyword and press Enter…"
                />
              </div>
            </div>
          </section>

          {/* SEO Description */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">SEO Description</h2>
              <span className={`text-xs tabular-nums ${charClass(seoDescription.length, 250, 500)}`}>
                {seoDescription.length} chars
              </span>
            </div>
            <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
              Rich product description shown on the page. Supports paragraph breaks (double newline).
            </p>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={10}
              placeholder="Write a detailed, keyword-rich description…"
              className={inputBase()}
            />
          </section>

          {/* Product-only fields */}
          {isProduct && (
            <>
              {/* Image Alt Texts */}
              {images.length > 0 && (
                <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">Image Alt Texts</h2>
                  <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
                    Describe each image for accessibility and image search. Max 125 chars each.
                  </p>
                  <div className="space-y-3">
                    {images.map((img, i) => (
                      <div key={img._key} className="flex items-start gap-3">
                        <img
                          src={img.asset.url}
                          alt=""
                          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="mb-0.5 flex justify-between">
                            <span className="text-xs text-zinc-400">Image {i + 1}</span>
                            <span className={`text-xs tabular-nums ${charClass((altTexts[i] ?? "").length, 100, 125)}`}>
                              {(altTexts[i] ?? "").length}/125
                            </span>
                          </div>
                          <input
                            type="text"
                            value={altTexts[i] ?? ""}
                            onChange={(e) => {
                              const next = [...altTexts];
                              while (next.length <= i) next.push("");
                              next[i] = e.target.value;
                              setAltTexts(next);
                            }}
                            placeholder={`Describe image ${i + 1}…`}
                            maxLength={125}
                            className={inputBase()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Social Caption */}
              <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Social Caption</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs tabular-nums ${charClass(socialCaption.length, 180, 200)}`}>
                      {socialCaption.length}/200
                    </span>
                    <button
                      type="button"
                      onClick={copyCaption}
                      disabled={!socialCaption}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      {captionCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {captionCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Instagram-ready caption with emojis and hashtags.
                </p>
                <textarea
                  value={socialCaption}
                  onChange={(e) => setSocialCaption(e.target.value)}
                  rows={4}
                  placeholder="✨ Caption for Instagram…"
                  className={inputBase()}
                />
              </section>

              {/* Search Tags */}
              <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">Search Tags</h2>
                <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Internal search and discovery tags. Press Enter to add.
                </p>
                <TagsInput
                  tags={searchTags}
                  onChange={setSearchTags}
                  placeholder="e.g. statement earrings, gift for her…"
                />
              </section>
            </>
          )}

          {/* Advanced */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Advanced</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="Leave blank to use the page's own URL"
                  className={inputBase()}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    No-index this page
                  </span>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Hide from search engines (e.g. draft or discontinued products)
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Save button at bottom */}
          <div className="flex justify-end gap-3 pb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/seo">Cancel</Link>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isGenerating}
              className="gap-1.5"
            >
              {saveStatus === "saved" ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving…" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
