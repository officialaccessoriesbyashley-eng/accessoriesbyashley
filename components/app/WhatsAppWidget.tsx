"use client";

import { useState } from "react";
import { X } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "254700000000";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello! I'm interested in your jewelry collection. Can you help me?"
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

// WhatsApp doodle background — the subtle pattern seen in WA chats
function WaDoodleBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#e5ddd5",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' opacity='0.07'%3E%3Ctext x='5' y='30' font-size='22'%3E💍%3C/text%3E%3Ctext x='45' y='65' font-size='18'%3E✨%3C/text%3E%3Ctext x='10' y='70' font-size='16'%3E💎%3C/text%3E%3Ctext x='50' y='25' font-size='20'%3E📿%3C/text%3E%3C/svg%3E")`,
      }}
    />
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Popup */}
      {open && (
        <div className="w-72 overflow-hidden rounded-2xl shadow-2xl sm:w-80">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: "#075e54" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <WhatsAppIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Accessories by Ashley
                </p>
                <p className="text-xs text-green-200">
                  Typically replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat body */}
          <div className="relative min-h-[140px] px-4 py-5">
            <WaDoodleBackground />
            <div className="relative">
              <div
                className="inline-block max-w-[85%] rounded-lg rounded-tl-none px-3 py-2 shadow-sm"
                style={{ backgroundColor: "#fff" }}
              >
                <p className="text-sm text-zinc-800">
                  Hello! Welcome to Accessories by Ashley. 👋
                  <br />
                  How can we help you today?
                </p>
                <p className="mt-1 text-right text-[10px] text-zinc-400">
                  Just now
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-4 pb-4 pt-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25d366" }}
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp Us
            </a>
            <p className="mt-2 text-center text-xs text-zinc-400">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-400" />
              Online
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open WhatsApp chat"
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: "#25d366" }}
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <WhatsAppIcon className="h-7 w-7 text-white" />
        )}
      </button>
    </div>
  );
}
