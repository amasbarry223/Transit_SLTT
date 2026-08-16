"use client";

import { Building2, User } from "lucide-react";
import type { ClientType } from "@/lib/domain-types";
import { ToneBadge } from "@/components/sltt/status-badge";

export function ClientTypeBadge({
  type,
  size = "sm",
}: {
  type: ClientType;
  size?: "sm" | "md";
}) {
  const Icon = type === "Entreprise" ? Building2 : User;
  return (
    <ToneBadge
      tone={type === "Entreprise" ? "blue" : "slate"}
      icon={Icon}
      size={size}
      dot={false}
    >
      {type}
    </ToneBadge>
  );
}
