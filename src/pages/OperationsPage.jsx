import PredictionPanel from "@components/PredictionPanel";
import { PageShell } from "@components/ui/PageShell";

export default function OperationsPage(props) {
  return (
    <PageShell>
      <PredictionPanel {...props} />
    </PageShell>
  );
}
