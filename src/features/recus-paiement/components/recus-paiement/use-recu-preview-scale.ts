"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { RECEIPT_HEIGHT_MM, RECEIPT_WIDTH_MM } from "@/lib/recus-paiement-styles";

/** mm → px (96 dpi) — approximation stable pour le calcul de scale. */
function mmToPx(mm: number): number {
  return mm * 3.7795275591;
}

const RECEIPT_W_PX = mmToPx(RECEIPT_WIDTH_MM);
const RECEIPT_H_PX = mmToPx(RECEIPT_HEIGHT_MM);

export function useRecuPreviewScale(containerRef: RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(0.75);

  const updateScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    const pad = 16;
    const sx = (width - pad) / RECEIPT_W_PX;
    const sy = (height - pad) / RECEIPT_H_PX;
    setScale(Math.min(sx, sy, 1));
  }, [containerRef]);

  useEffect(() => {
    updateScale();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    window.addEventListener("resize", updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [containerRef, updateScale]);

  return scale;
}
