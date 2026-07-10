import { AppRoot } from "@/components/sltt/app-root";
import { RouteSync } from "@/components/sltt/route-sync";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FactureDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <>
      <RouteSync view="facture-detail" id={id} />
      <AppRoot />
    </>
  );
}
