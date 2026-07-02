"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setVisible(true);
    setWidth(15);
    intervalRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 85) {
          clearInterval(intervalRef.current!);
          return 85;
        }
        return Math.min(w + Math.random() * 12, 85);
      });
    }, 350);
  }

  function finish() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWidth(100);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 350);
  }

  // Complete when navigation finishes (pathname changes)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      finish();
    }
  }, [pathname]);

  // Start on any internal link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.target === "_blank"
      )
        return;
      start();
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] bg-zinc-900 dark:bg-zinc-100"
      style={{
        width: `${width}%`,
        transition: `width ${width === 100 ? 200 : 400}ms ease-out`,
      }}
    />
  );
}
