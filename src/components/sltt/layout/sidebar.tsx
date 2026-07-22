"use client";

import Image from "next/image";
import { useNav } from "@/lib/nav-store";
import { useVisibleNavItems } from "@/hooks/use-visible-nav-items";
import { useStore } from "@/lib/store";
import { resolveAppShellBranding } from "@/lib/societe-brand";
import { NavList } from "./nav-list";

export function Sidebar() {
  const view = useNav((s) => s.view);
  const go = useNav((s) => s.go);
  const societes = useStore((s) => s.societes);
  const shellBrand = resolveAppShellBranding(societes);
  const visibleItems = useVisibleNavItems();

  return (
    <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="flex h-16 w-full border-b border-border">
        <Image
          src={shellBrand.logoUrl ?? "/logoV.png"}
          alt={shellBrand.appTitle}
          width={72}
          height={72}
          className="m-auto size-[56px] object-contain drop-shadow"
          unoptimized
        />
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <NavList items={visibleItems} currentView={view} onNavigate={go} />
      </nav>
    </aside>
  );
}
