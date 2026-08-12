"use client";

import Image from "next/image";
import { useNav } from "@/lib/nav-store";
import { useAppNavigation } from "@/lib/app-navigation";
import { useVisibleNavItems } from "@/hooks/use-visible-nav-items";
import { useStore } from "@/lib/store";
import { resolveAppShellBranding } from "@/lib/societe-brand";
import { NavList } from "./nav-list";

export function SidebarBrand({
  logoUrl,
  alt,
  size = "md",
  onClick,
}: {
  logoUrl?: string;
  alt: string;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  const dim = size === "sm" ? "size-14" : "size-[4.25rem]";
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute -inset-3 rounded-full bg-primary/0 transition-all duration-300 ease-out group-hover:bg-primary/[0.08] group-hover:scale-110 motion-reduce:transition-none"
      />
      <span
        aria-hidden
        className="absolute -inset-1 rounded-full ring-1 ring-transparent transition-all duration-300 group-hover:ring-primary/20 motion-reduce:transition-none"
      />
      <Image
        src={logoUrl ?? "/logoV.png"}
        alt={alt}
        width={size === "sm" ? 56 : 68}
        height={size === "sm" ? 56 : 68}
        className={`relative ${dim} object-contain drop-shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] motion-reduce:transform-none`}
        unoptimized
      />
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        aria-label="Retour au tableau de bord"
      >
        {inner}
      </button>
    );
  }

  return <div className="group relative flex items-center justify-center">{inner}</div>;
}

export function Sidebar() {
  const view = useNav((s) => s.view);
  const comptaTab = useNav((s) => s.comptaTab);
  const { goToView } = useAppNavigation();
  const societes = useStore((s) => s.societes);
  const shellBrand = resolveAppShellBranding(societes);
  const visibleItems = useVisibleNavItems();

  return (
    <aside className="hidden lg:flex w-[252px] shrink-0 flex-col border-r border-border/80 bg-sidebar h-screen sticky top-0">
      <div className="relative flex items-center justify-center border-b border-border/60 px-4 py-6">
        <SidebarBrand
          logoUrl={shellBrand.logoUrl}
          alt={shellBrand.appTitle}
          onClick={() => goToView("dashboard")}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavList
          items={visibleItems}
          currentView={view}
          currentComptaTab={comptaTab}
          onNavigate={(item) =>
            goToView(item.key, item.comptaTab ? { comptaTab: item.comptaTab } : undefined)
          }
        />
      </nav>
    </aside>
  );
}
