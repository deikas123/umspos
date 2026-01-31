import Users from "@/components/users/Users";
import { getUsersPageData } from "@/lib/actions/users";

export const revalidate = 300;

export default async function UsersPage() {
  // Fetch users data server-side
  const initialData = await getUsersPageData();

  return (
    <div className='container mx-auto px-4'>
      <Users initialData={initialData} />
    </div>
  );
}
