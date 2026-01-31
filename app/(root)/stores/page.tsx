import Stores from "@/components/stores/Stores";
import { getAgentsPageData } from "@/lib/actions/agents";

export const revalidate = 60;

export default async function StoresPage() {
  // Fetch stores data server-side (stores are agents with is_store = true)
  const initialData = await getAgentsPageData({ isStore: true });

  return (
    <div className='container mx-auto px-4'>
      <h1 className='text-3xl font-bold text-center drop-shadow-lg'>
        UMS Kenya Stores
      </h1>
      <Stores initialData={initialData} />
    </div>
  );
}
