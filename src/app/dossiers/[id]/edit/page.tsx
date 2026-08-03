import { ViewRoutePage } from "@/components/sltt/view-route-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DossierEditPage({ params }: PageProps) {
  const { id } = await params;
  return <ViewRoutePage view="dossier-form" id={id} dossierMode="edit" />;
}
