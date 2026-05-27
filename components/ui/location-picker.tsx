"use client";

import { useState } from "react";
import { MapPin, Loader2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface LocationPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function LocationPicker({
  value,
  onChange,
  label = "Drop Pin",
}: LocationPickerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  function pick() {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Your browser doesn't support location sharing.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        onChange(url);
        setStatus("idle");
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg(
            "Location access denied. Allow location in your browser settings and try again."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg("Location unavailable. Check your GPS and try again.");
        } else {
          setErrorMsg("Couldn't get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function clear() {
    onChange("");
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <div className="space-y-1.5">
      <Label>
        {label}{" "}
        <span className="text-zinc-400">(optional)</span>
      </Label>

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm dark:border-green-800 dark:bg-green-950/40">
          <MapPin className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <span className="flex-1 font-medium text-green-800 dark:text-green-200">
            Location pinned
          </span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-green-700 underline underline-offset-2 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            type="button"
            onClick={clear}
            className="text-green-500 hover:text-green-700 dark:text-green-500 dark:hover:text-green-300"
            aria-label="Remove location"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={pick}
          disabled={status === "loading"}
          className="w-full gap-2"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {status === "loading" ? "Getting your location…" : "Share My Location"}
        </Button>
      )}

      {status === "error" && (
        <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
