"use client";

import { useMemo } from "react";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import { isValidRole } from "@/lib/utils/rolePermissions";

// Import subcomponents
import { NavigationMenu } from "./NavigationMenu";
import { NavigationMenuSkeleton } from "./NavigationMenuSkeleton";
import { ActionsMenu } from "./ActionsMenu";
import { ActionsMenuSkeleton } from "./ActionsMenuSkeleton";
import { MobileUserSection } from "./MobileUserSection";
import { useRoleBasedFiltering } from "./hooks/useRoleBasedFiltering";
import { useActionDialogs } from "./hooks/useActionDialogs";

export function AppSidebar() {
  const { user, userRole, isLoading } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Safe role validation - memoized
  const safeUserRole = useMemo(
    () => (isValidRole(userRole) ? userRole : null),
    [userRole]
  );

  // Memoize user data to prevent recreation
  const currentUserData = useMemo(
    () => ({
      id: user?.id || "",
      name: user?.name || "",
    }),
    [user?.id, user?.name]
  );

  // Custom hooks for filtering and state management
  const { filteredNavItems, filteredActionItems } =
    useRoleBasedFiltering(safeUserRole);
  const actionStateMap = useActionDialogs();

  // Show skeleton only during initial session loading (before any auth state is known)
  // Once we have a role (even the default "user"), show navigation immediately
  const showSkeleton = isLoading && !userRole;

  return (
    <Sidebar
      variant='inset'
      collapsible='icon'
      className='flex flex-col justify-between h-screen bg-white border-r mt-16'>
      <SidebarContent>
        {showSkeleton ? (
          <>
            <NavigationMenuSkeleton />
            <ActionsMenuSkeleton />
          </>
        ) : (
          <>
            <NavigationMenu items={filteredNavItems} currentPath={pathname} />
            <ActionsMenu
              items={filteredActionItems}
              actionStateMap={actionStateMap}
              user={user}
              currentUserData={currentUserData}
            />
          </>
        )}

        {isMobile && (
          <MobileUserSection user={user} safeUserRole={safeUserRole} />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
