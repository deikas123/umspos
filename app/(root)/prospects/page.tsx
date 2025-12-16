import { getAllProspects, getMyProspects } from "@/lib/actions/prospects";
import AdminProspectsList from "@/components/prospects/AdminProspectsList";
import SalesPersonProspectsList from "@/components/prospects/SalesPersonProspectsList";
import type { ClientProspect } from "@/lib/db/schema";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { isSalesPerson } from "@/lib/utils/rolePermissions";

export default async function ProspectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userRole = (session?.user as any)?.appRole;

  if (isSalesPerson(userRole)) {
    const prospects = (await getMyProspects()) as ClientProspect[];
    return <SalesPersonProspectsList initialProspects={prospects} />;
  }

  const prospects = (await getAllProspects()) as ClientProspect[];
  return <AdminProspectsList initialProspects={prospects} />;
}
