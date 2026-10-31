import { getPendingUpdateRequests } from "@/lib/actions/sale-updates";
import { ApprovalsPage } from "@/components/approvals/ApprovalsPage";

export const dynamic = "force-dynamic";

export default async function Approvals() {
  const pendingRequests = await getPendingUpdateRequests();

  return <ApprovalsPage initialPendingRequests={pendingRequests} />;
}
