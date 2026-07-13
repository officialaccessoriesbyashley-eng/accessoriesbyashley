import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

// Read-only client (for fetching data)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

// Admin read client - bypasses CDN so admin pages always see the latest data
export const adminClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});

// Write client (for mutations - used in webhooks/server actions)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
