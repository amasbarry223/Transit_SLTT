"use client";

/**
 * Remplace les <canvas> (ex. signatures) par des <img> pendant le cycle
 * d'impression natif du navigateur, puis restaure — un canvas ne s'imprime
 * pas de façon fiable sur tous les moteurs. Branché globalement par
 * PrintGlobalEffects (app/layout.tsx). Le reste de l'impression passe par
 * l'iframe dédiée de lib/export/print-document.ts.
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
