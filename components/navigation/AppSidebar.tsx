"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe role validation - memoized
  // Don't assume any role - wait for auth to load
  const safeUserRole = useMemo(() => {
    if (!mounted || isLoading || !userRole) return null;
    return isValidRole(userRole) ? userRole : null;
  }, [userRole, mounted, isLoading]);

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

  // Show skeleton until auth is fully loaded and we know the user's role
  // This prevents rendering navigation items the user shouldn't see
  const showSkeleton = !mounted || isLoading || !safeUserRole;

  return (
    <Sidebar
      variant='inset'
      collapsible='icon'
      className='flex flex-col p-0 justify-between h-[calc(100vh-4rem)] border-r mt-16'>
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
