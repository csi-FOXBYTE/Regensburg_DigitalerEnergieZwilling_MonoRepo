import { RecordDetail } from "@/features/TriageView/RecordDetail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_with_header/record/$id/")({
  component: RecordDetailPage,
});

function RecordDetailPage() {
  const { id } = Route.useParams();
  return <RecordDetail key={id} id={id} />;
}
