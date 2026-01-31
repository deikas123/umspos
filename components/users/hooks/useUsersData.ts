import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  getUsersList,
  getCurrentUser,
  updateUserProfile,
  deleteUserProfile,
} from "@/lib/actions/users";
// Real-time subscriptions removed as we're migrating from Supabase

// Interface matches the return type from getUsersList (Better Auth user table)
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
}

// Interface for current user (from getCurrentUser action)
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
}

// Type for initial data from server
export interface UsersPageData {
  users: User[];
}

// Query keys
const USERS_KEYS = {
  all: ["users"] as const,
  lists: () => [...USERS_KEYS.all, "list"] as const,
  current: () => [...USERS_KEYS.all, "current"] as const,
} as const;

// 30 minutes stale time since user data doesn't change frequently
const STALE_TIME = 30 * 60 * 1000;
const GC_TIME = STALE_TIME * 2; // 1 hour

export function useUsersData(
  showDeactivated: boolean,
  initialData?: UsersPageData,
) {
  const queryClient = useQueryClient();
  const hasInitialData = !!initialData;

  // Real-time subscriptions removed during Supabase to Drizzle migration
  // Manual refresh will be required for real-time updates

  // Query for users list - use initialData if available
  const {
    data: users = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<User[]>({
    queryKey: ["users", showDeactivated],
    queryFn: () => getUsersList() as Promise<User[]>,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    initialData: initialData?.users,
    refetchOnMount: !hasInitialData,
    select: (data) =>
      showDeactivated ? data : data.filter((user) => user.isActive),
  });

  // Query for current user
  const { data: currentUser } = useQuery<CurrentUser | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // Mutation for updating user
  const { mutateAsync: updateUser, isPending } = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: {
        name?: string;
        phoneNumber?: string;
        role?: string;
        is_active?: boolean;
      };
    }) => {
      // The server action accepts UserRole, but we pass string from UI
      // The server validates the role value
      const result = await updateUserProfile(
        userId,
        updates as Parameters<typeof updateUserProfile>[1],
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUserProfile(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() });
    },
  });

  return {
    users,
    currentUser,
    isLoading,
    isFetching,
    error,
    updateUser,
    isPending,
    refetch: (options?: { throwOnError?: boolean }) =>
      refetch({
        cancelRefetch: false,
        throwOnError: options?.throwOnError ?? false,
      }),
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending,
  };
}
