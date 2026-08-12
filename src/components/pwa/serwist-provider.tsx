"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

const swDisabled =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SERWIST_DEV !== "1";

export function AppSerwistProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js" disable={swDisabled} reloadOnOnline>
      {children}
    </SerwistProvider>
  );
}
