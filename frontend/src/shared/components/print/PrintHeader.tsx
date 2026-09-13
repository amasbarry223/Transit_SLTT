"use client";

import React from "react";
import Image from "next/image";

export interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  reference?: string;
  date?: string;
  logoUrl?: string;
}

export function PrintHeader({
  title,
  subtitle,
  reference,
  date,
  logoUrl = "/logoV.png",
}: PrintHeaderProps) {
  const formattedDate =
    date ||
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

  return (
    <div className="print-header flex w-full items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden">
          <Image
            src={logoUrl}
            alt="Logo"
            width={48}
            height={48}
            priority
            className="size-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight text-slate-900 m-0">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 m-0 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="text-right text-xs text-slate-600 space-y-0.5">
        {reference && <div className="font-mono font-semibold text-slate-800">Réf : {reference}</div>}
        <div>Édité le {formattedDate}</div>
      </div>
    </div>
  );
}
