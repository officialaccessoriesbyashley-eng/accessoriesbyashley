"use client";

import { useEffect, useState } from "react";
import { SanityApp } from "@sanity/sdk-react";
import { dataset, projectId } from "@/sanity/env";
import LoadingSpinner from "@/components/loaders/LoadingSpinner";

function SanityAppProvider({ children }: { children: React.ReactNode }) {
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
    <SanityApp
      config={[
        {
          projectId,
          dataset,
          ...(token ? { auth: { token } } : {}),
        },
      ]}
      fallback={<div />}
    >
      {children}
    </SanityApp>
  );
}

export default SanityAppProvider;
