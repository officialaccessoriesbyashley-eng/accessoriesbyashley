"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { SanityApp } from "@sanity/sdk-react";
import { dataset, projectId } from "@/sanity/env";
import LoadingSpinner from "@/components/loaders/LoadingSpinner";

class SanityErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Failed to connect to Sanity
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SanityAppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/token")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.token) setToken(data.token);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Authenticating..." isFullScreen size="lg" />;
  }

  return (
    <SanityErrorBoundary>
      <SanityApp
        config={[
          {
            projectId,
            dataset,
            ...(token ? { auth: { token } } : {}),
          },
        ]}
        fallback={<LoadingSpinner text="Connecting to Sanity..." isFullScreen size="lg" />}
      >
        {children}
      </SanityApp>
    </SanityErrorBoundary>
  );
}

export default SanityAppProvider;
