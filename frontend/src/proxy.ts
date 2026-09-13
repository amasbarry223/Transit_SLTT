import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP posée ici (pas dans next.config.ts) car script-src a besoin d'un nonce
 * généré par requête : Next.js App Router injecte plusieurs <script> inline
 * pour le streaming RSC (self.__next_f.push(...)), dont le contenu diffère à
 * chaque requête — impossible à couvrir par un hash statique.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // En dev, le HMR webpack de `next dev` évalue du code via eval() pour les
  // source maps, et les scripts injectés par la toolchain dev ne portent pas le nonce.
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? "'self' 'unsafe-inline' 'unsafe-eval'"
      : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: http://localhost:3001",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:3001 ws://localhost:3001 blob:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'self' blob: http://localhost:3001",
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
