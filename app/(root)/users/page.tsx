import Users from "@/components/users/Users";
import { getUsersPageData } from "@/lib/actions/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // Fetch users data server-side
  const initialData = await getUsersPageData();

  return (
    <div className='container mx-auto px-2 sm:px-4 mt-16 sm:mt-8'>
      <Users initialData={initialData} />
    </div>
  );
}
