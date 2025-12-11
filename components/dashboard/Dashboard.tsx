import React from "react";
import { SalesBarchart } from "@/components/dashboard/SalesBarchart";

interface SalesChartDataItem {
  date: string;
  meter_type: string;
  total_amount: number;
  user_sales: Record<string, number>;
  user_names: string[];
}

interface DashboardProps {
  initialChartData: SalesChartDataItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ initialChartData }) => {
  return (
    <div className='w-full h-full'>
      <SalesBarchart initialData={initialChartData} />
    </div>
  );
};

export default Dashboard;
