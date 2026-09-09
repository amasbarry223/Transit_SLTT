"use client";

import React, { useRef, useEffect } from "react";
import { usePrint } from "@/shared/hooks/usePrint";
import { Button } from "@/shared/components/ui/button";
import { Printer } from "lucide-react";

export interface PrintWrapperProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  showButton?: boolean;
  className?: string;
}

export function PrintWrapper({
  children,
  header,
  footer,
  title,
  showButton = true,
  className = "",
}: PrintWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { print, isPrinting } = usePrint({
    delay: 250,
    waitForImages: true,
  });

  useEffect(() => {
    const origTitle = document.title;
    const beforePrint = () => {
      if (title) document.title = title;
    };
    const afterPrint = () => {
      document.title = origTitle;
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [title]);

  return (
    <>
      {showButton && (
        <div className="no-print print-actions mb-4 flex justify-end">
          <Button
            onClick={print}
            disabled={isPrinting}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Printer className="size-4" />
            {isPrinting ? "Préparation de l'impression…" : "Imprimer (Ctrl+P)"}
          </Button>
        </div>
      )}

      <div ref={contentRef} className={`print-container ${className}`}>
        {header && <div className="print-header">{header}</div>}
        {children}
        {footer && <div className="print-footer">{footer}</div>}
      </div>
    </>
  );
}
