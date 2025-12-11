import React from "react";
import DailyReports from "@/components/dailyreports/DailyReportspage";
import { getDailyReportsPageData } from "@/lib/actions/reports";

export const dynamic = 'force-dynamic';

export default async function DailyReportsPage() {
  // Fetch all daily reports data server-side in a single call
  const initialData = await getDailyReportsPageData();

  return (
    <div>
      <DailyReports initialData={initialData} />
    </div>
  );
}
