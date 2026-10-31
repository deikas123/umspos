import Agents from "@/components/agents/Agents";
import { getAgentsPageData } from "@/lib/actions/agents";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  // Fetch agents data server-side
  const initialData = await getAgentsPageData();

  return (
    <div className='container mx-auto px-4'>
      <h1 className='text-3xl font-bold text-center drop-shadow-lg'>
        UMS Kenya Agents
      </h1>
      <Agents initialData={initialData} />
    </div>
  );
}
