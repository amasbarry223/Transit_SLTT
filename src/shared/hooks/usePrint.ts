"use client";

import { useState, useCallback, useEffect } from "react";

export interface UsePrintOptions {
  onBeforePrint?: () => Promise<void> | void;
  onAfterPrint?: () => void;
  waitForImages?: boolean;
  delay?: number;
}

/**
 * Attend que toutes les images du document (ou d'un conteneur) soient complètement chargées.
 * Évite le calcul d'un aperçu avec des images manquantes ou des dimensions erronées.
 */
export async function waitForImagesToLoad(doc: Document = document): Promise<void> {
  const images = Array.from(doc.images);
  const unloaded = images.filter((img) => !img.complete || img.naturalWidth === 0);
  if (unloaded.length === 0) return;

  await Promise.all(
    unloaded.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const onDone = () => {
            img.removeEventListener("load", onDone);
            img.removeEventListener("error", onDone);
            resolve();
          };
          img.addEventListener("load", onDone);
          img.addEventListener("error", onDone);
          // Sécurité : timeout de 2500ms max par image pour ne jamais bloquer l'impression
          setTimeout(onDone, 2500);
        }),
    ),
  );
}

/**
 * Remplace temporairement les éléments <canvas> par des balises <img> contenant
 * leur dataURL pour garantir un rendu parfait à l'impression dans Chromium/WebKit.
 */
export function setupCanvasPrintReplacements(): () => void {
  const beforePrint = () => {
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((canvas) => {
      if (canvas.dataset.printReplaced) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = dataUrl;
        img.style.cssText = canvas.style.cssText;
        img.className = canvas.className;
        img.dataset.printReplacementFor = "canvas";
        canvas.parentNode?.insertBefore(img, canvas);
        canvas.style.display = "none";
        canvas.dataset.printReplaced = "true";
      } catch {
        /* Ignorer si tainted canvas */
      }
    });
  };

  const afterPrint = () => {
    document.querySelectorAll('[data-print-replaced="true"]').forEach((el) => {
      const canvas = el as HTMLCanvasElement;
      canvas.style.display = "";
      delete canvas.dataset.printReplaced;
    });
    document.querySelectorAll('[data-print-replacement-for="canvas"]').forEach((img) => {
      img.remove();
    });
  };

  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);

  return () => {
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
    afterPrint();
  };
}

/**
 * Hook d'impression sécurisé optimisé pour la rapidité et la fiabilité de l'aperçu Chrome/Edge/Safari.
 */
export function usePrint(options: UsePrintOptions = {}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const cleanup = setupCanvasPrintReplacements();
    return cleanup;
  }, []);

  const print = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsPrinting(true);
    setIsReady(false);

    try {
      // 1. Exécuter le callback préparatoire (chargement de données, fermeture de menus, etc.)
      if (options.onBeforePrint) {
        await options.onBeforePrint();
      }

      // 2. Attendre le chargement complet de toutes les images
      if (options.waitForImages !== false) {
        await waitForImagesToLoad(document);
      }

      // 3. Attendre que les polices web soient prêtes
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          /* Fallback transparent */
        }
      }

      // 4. Délai supplémentaire si nécessaire (permet au navigateur d'achever le reflow)
      const delay = options.delay ?? 250;
      await new Promise((resolve) => setTimeout(resolve, delay));

      setIsReady(true);

      // 5. Déclencher le dialogue d'impression natif
      window.print();
    } finally {
      if (options.onAfterPrint) {
        options.onAfterPrint();
      }
      setIsPrinting(false);
      setIsReady(false);
    }
  }, [options]);

  return { print, isPrinting, isReady };
}

/**
 * Technique du "Print Frame" : imprime uniquement une section ciblée dans une iframe
 * isolée pour un aperçu ultra-rapide (< 1 seconde) sans charger le reste de l'UI.
 */
export function printSection(contentEl: HTMLElement | null, title?: string): void {
  if (!contentEl) return;

  const frameId = "sltt-section-print-frame";
  const existing = document.getElementById(frameId);
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:210mm;height:297mm;border:none;opacity:0.001;pointer-events:none;z-index:-99999;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title || document.title}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, system-ui, sans-serif;
  font-size: 10pt;
  color: #111827;
  background: #fff;
  padding: 12mm 10mm;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th { background: #f1f5f9; color: #0f172a; font-weight: 700; font-size: 8.5pt; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; }
td { font-size: 8.5pt; padding: 5px 8px; border: 1px solid #e2e8f0; color: #1e293b; }
img { max-width: 100%; height: auto; page-break-inside: avoid; }
.no-print { display: none !important; }
@page { size: A4 portrait; margin: 12mm 10mm; }
</style>
</head>
<body>
${contentEl.innerHTML}
</body>
</html>`);
  doc.close();

  const doPrint = async () => {
    try {
      await waitForImagesToLoad(doc);
      if (doc.fonts) {
        await doc.fonts.ready;
      }
      win.focus();
      win.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }
  };

  setTimeout(doPrint, 200);
}
