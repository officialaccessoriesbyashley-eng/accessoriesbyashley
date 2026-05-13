import { gateway } from "ai";
import { generateObject } from "ai";
import { z } from "zod";
import { sanityFetch } from "@/sanity/lib/live";
import { defineQuery } from "next-sanity";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock";
import { formatPrice } from "@/lib/utils";

const ADMIN_METRICS_QUERY = defineQuery(`{
  "currentRevenue": math::sum(*[_type == "order" && status in ["paid", "shipped", "delivered"] && dateTime(createdAt) > dateTime(now()) - 60*60*24*30].total),
  "previousRevenue": math::sum(*[_type == "order" && status in ["paid", "shipped", "delivered"] && dateTime(createdAt) > dateTime(now()) - 60*60*24*60 && dateTime(createdAt) <= dateTime(now()) - 60*60*24*30].total),
  "orderCount": count(*[_type == "order" && dateTime(createdAt) > dateTime(now()) - 60*60*24*30]),
  "unfulfilledCount": count(*[_type == "order" && status in ["paid", "pending"]]),
  "lowStockCount": count(*[_type == "product" && stock > 0 && stock <= ${LOW_STOCK_THRESHOLD}]),
  "outOfStockCount": count(*[_type == "product" && stock == 0]),
  "totalProducts": count(*[_type == "product"]),
  "topProducts": *[_type == "order" && dateTime(createdAt) > dateTime(now()) - 60*60*24*30].items[].product->name
}`);

const insightsSchema = z.object({
  salesTrends: z.object({
    summary: z.string(),
    highlights: z.array(z.string()),
    trend: z.enum(["up", "down", "stable"]),
  }),
  inventory: z.object({
    summary: z.string(),
    alerts: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  actionItems: z.object({
    urgent: z.array(z.string()),
    recommended: z.array(z.string()),
    opportunities: z.array(z.string()),
  }),
});

export async function GET() {
  try {
    const { data: metrics } = await sanityFetch({
      query: ADMIN_METRICS_QUERY,
    });

    const currentRevenue = (metrics as any)?.currentRevenue ?? 0;
    const previousRevenue = (metrics as any)?.previousRevenue ?? 0;
    const orderCount = (metrics as any)?.orderCount ?? 0;
    const unfulfilledCount = (metrics as any)?.unfulfilledCount ?? 0;
    const lowStockCount = (metrics as any)?.lowStockCount ?? 0;
    const outOfStockCount = (metrics as any)?.outOfStockCount ?? 0;
    const totalProducts = (metrics as any)?.totalProducts ?? 0;
    const topProducts: string[] = ((metrics as any)?.topProducts ?? []).filter(
      Boolean
    );

    const revenueChange =
      previousRevenue > 0
        ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
        : "N/A";

    const avgOrderValue =
      orderCount > 0 ? (currentRevenue / orderCount).toFixed(2) : "0";

    const rawMetrics = {
      currentRevenue,
      previousRevenue,
      revenueChange,
      orderCount,
      avgOrderValue,
      unfulfilledCount,
      lowStockCount,
    };

    const prompt = `You are an AI business analyst for "Accessories by Ashley", a jewelry and accessories boutique. Analyze these metrics and provide actionable insights.

Metrics (last 30 days):
- Revenue: ${formatPrice(currentRevenue)} (previous period: ${formatPrice(previousRevenue)}, change: ${revenueChange}%)
- Orders: ${orderCount}
- Average order value: ${formatPrice(Number(avgOrderValue))}
- Unfulfilled orders: ${unfulfilledCount}
- Low stock items: ${lowStockCount} (threshold: ${LOW_STOCK_THRESHOLD} units)
- Out of stock items: ${outOfStockCount}
- Total products: ${totalProducts}
- Most ordered products: ${topProducts.slice(0, 10).join(", ") || "No data"}

Provide concise, actionable insights. Keep each point to 1-2 sentences max.`;

    const { object: insights } = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.5"),
      schema: insightsSchema,
      prompt,
    });

    return Response.json({
      success: true,
      insights,
      rawMetrics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Admin Insights] Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate insights",
      },
      { status: 500 }
    );
  }
}
