"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./sanity/schemaTypes";
import { DeleteProductAction } from "./sanity/actions/deleteProductAction";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [structureTool()],
  document: {
    actions: (prev, context) => {
      if (context.schemaType === "product") {
        // Replace the built-in delete action with our custom one
        const withoutBuiltinDelete = prev.filter((a) => a.action !== "delete");
        return [...withoutBuiltinDelete, DeleteProductAction];
      }
      return prev;
    },
  },
});
