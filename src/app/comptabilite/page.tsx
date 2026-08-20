import { ViewRoutePage } from "@/components/sltt/view-route-page";
import type { ComptaTab } from "@/lib/nav-store";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const comptaTab: ComptaTab | undefined = tab === "journal" ? "journal" : tab === "ecritures" ? "ecritures" : undefined;
  return <ViewRoutePage view="comptabilite" comptaTab={comptaTab} />;
}
