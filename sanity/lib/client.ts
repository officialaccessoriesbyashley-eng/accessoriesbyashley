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

// Write client (for mutations - used in webhooks/server actions)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});
