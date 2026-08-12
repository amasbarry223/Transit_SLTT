import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/** Ne jamais mettre en cache Supabase ni les routes API internes. */
const secureRuntimeCaching = [
  {
    matcher: ({ url }: { url: URL }) => /\.supabase\.co$/i.test(url.hostname),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({
      sameOrigin,
      url: { pathname },
    }: {
      sameOrigin: boolean;
      url: URL;
    }) => sameOrigin && pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: secureRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }: { request: Request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
