import {
  getAllProspectsPaginated,
  getMyProspectsPaginated,
  getUniqueSalesPersons,
} from "@/lib/actions/prospects";
import AdminProspectsList from "@/components/prospects/AdminProspectsList";
import SalesPersonProspectsList from "@/components/prospects/SalesPersonProspectsList";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { isSalesPerson } from "@/lib/utils/rolePermissions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function ProspectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userRole = (session?.user as any)?.appRole;

  if (isSalesPerson(userRole)) {
    const initialData = await getMyProspectsPaginated({
      page: 1,
      pageSize: PAGE_SIZE,
    });
    return <SalesPersonProspectsList initialData={initialData} />;
  }

  const [initialData, salesPersons] = await Promise.all([
    getAllProspectsPaginated({
      page: 1,
      pageSize: PAGE_SIZE,
    }),
    getUniqueSalesPersons(),
  ]);

  return (
    <AdminProspectsList initialData={initialData} salesPersons={salesPersons} />
  );
}
