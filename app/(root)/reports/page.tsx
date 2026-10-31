import Reports from "@/components/reports/Reports";
import { getReportsPageData } from "@/lib/actions/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  // Fetch all reports data server-side in a single call
  const initialData = await getReportsPageData();

  return <Reports initialData={initialData} />;
}
