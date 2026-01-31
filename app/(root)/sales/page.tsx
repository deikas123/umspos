import MeterSales from "@/components/sales/MeterSales";
import { getSaleBatches } from "@/lib/actions/sales";

export const revalidate = 60;

const ITEMS_PER_PAGE = 10;

export default async function SalesPage() {
  // Fetch initial data server-side - no POST request needed!
  const initialData = await getSaleBatches(1, ITEMS_PER_PAGE);

  return (
    <div className='container mx-auto px-4 '>
      <MeterSales initialData={initialData} />
    </div>
  );
}
