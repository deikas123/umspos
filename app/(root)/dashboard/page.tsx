import Dashboard from "@/components/dashboard/Dashboard";
import { getSalesChartData } from "@/lib/actions/sales";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

async function DashboardContent() {
  // Fetch data server-side - no POST request needed!
  const initialChartData = await getSalesChartData(30);

  return <Dashboard initialChartData={initialChartData} />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-[50vh] w-full items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      }>
      <DashboardContent />
    </Suspense>
  );
}
