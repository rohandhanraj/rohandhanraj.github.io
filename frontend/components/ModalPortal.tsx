"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children directly into document.body via a React portal.
 * This ensures modals and overlays escape any ancestor stacking context
 * (e.g. sections with z-index + Framer Motion transforms).
 */
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Guard against SSR — document is not available on the server
  if (!mounted) return null;

  return createPortal(children, document.body);
}
