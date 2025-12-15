import { getPendingUpdateRequests } from "@/lib/actions/sale-updates";
import { ApprovalsPage } from "@/components/approvals/ApprovalsPage";

export default async function Approvals() {
  const pendingRequests = await getPendingUpdateRequests();

  return <ApprovalsPage initialPendingRequests={pendingRequests} />;
}
