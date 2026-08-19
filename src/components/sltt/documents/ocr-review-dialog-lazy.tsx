"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const OcrReviewDialogImpl = dynamic(
  () => import("./ocr-review-dialog").then((m) => ({ default: m.OcrReviewDialog })),
  { ssr: false },
);

export function OcrReviewDialogLazy(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  existingDossierId?: string;
  defaultClientId?: string;
}) {
  // Ne monte (et ne charge tesseract.js/pdfjs-dist) qu'à la première ouverture
  // réelle du dialog ; reste monté ensuite pour préserver l'animation de
  // fermeture de Radix Dialog.
  const [mounted, setMounted] = useState(props.open);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- montage paresseux : charge tesseract/pdfjs à la première ouverture, puis garde le dialog monté pour l'animation Radix
    if (props.open) setMounted(true);
  }, [props.open]);

  if (!mounted) return null;
  return <OcrReviewDialogImpl {...props} />;
}
