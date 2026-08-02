import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP posée ici (pas dans next.config.ts) car script-src a besoin d'un nonce
 * généré par requête : Next.js App Router injecte plusieurs <script> inline
 * pour le streaming RSC (self.__next_f.push(...)), dont le contenu diffère à
 * chaque requête — impossible à couvrir par un hash statique. Le nonce est
 * propagé aux scripts que Next.js injecte lui-même ; 'strict-dynamic' étend
 * la confiance aux scripts que ces scripts nonce injectent à leur tour, donc
 * pas besoin de nonce individuel sur chacun.
 * Repli 'self' pour les navigateurs sans support de strict-dynamic (CSP2) —
 * ignoré par les navigateurs CSP3, qui n'utilisent alors que nonce + strict-dynamic.
 * Doc officielle : https://nextjs.org/docs/app/guides/content-security-policy
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const supabaseWsUrl = supabaseUrl.replace(/^http/, "ws");

  // En dev, le HMR webpack de `next dev` évalue du code via eval() pour les
  // source maps (bloqué sinon : page figée sur "Vérification de la session…"),
  // et les scripts injectés par la toolchain dev ne portent pas le nonce.
  // Sans impact en production, seul environnement qui compte pour cette CSP.
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? "'self' 'unsafe-inline' 'unsafe-eval'"
      : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    // Logos Storage + aperçus documents (signed URLs Supabase)
    `img-src 'self' data: blob: ${supabaseUrl}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseUrl} ${supabaseWsUrl} blob:`,
    "worker-src 'self' blob:",
    // Aperçu PDF / documents dans iframes (signed URL Storage)
    `frame-src 'self' blob: ${supabaseUrl}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}
