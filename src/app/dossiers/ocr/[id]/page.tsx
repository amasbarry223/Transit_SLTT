import { RouteSync } from "@/components/sltt/route-sync";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DossierOcrReviewPage({ params }: PageProps) {
  const { id } = await params;
  return <RouteSync view="dossier-ocr-review" id={id} />;
}
