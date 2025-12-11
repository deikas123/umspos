import Dashboard from "@/components/dashboard/Dashboard";
import { getSalesChartData } from "@/lib/actions/sales";

export default async function DashboardPage() {
  // Fetch data server-side - no POST request needed!
  const initialChartData = await getSalesChartData(30);

  return <Dashboard initialChartData={initialChartData} />;
}
