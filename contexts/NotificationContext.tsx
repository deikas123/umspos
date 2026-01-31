"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from "@/lib/actions/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface NotificationContextType {
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for unread count - only fetches when user is available
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return await getUnreadNotificationsCount(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        // Optimistically update unread count
        queryClient.setQueryData(
          ["notifications", "unread-count", user.id],
          (old: number = 0) => Math.max(0, old - 1),
        );

        await markNotificationAsRead(notificationId, user.id);

        // Invalidate to ensure consistency
        queryClient.invalidateQueries({
          queryKey: ["notifications", user.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count", user.id],
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");

        // Revert optimistic update on error
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count", user.id],
        });
      }
    },
    [queryClient, user?.id],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Optimistically set unread count to 0
      queryClient.setQueryData(["notifications", "unread-count", user.id], 0);

      await markAllNotificationsAsRead(user.id);

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["notifications", user.id],
      });

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");

      // Revert on error
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count", user.id],
      });
    }
  }, [queryClient, user?.id]);

  const contextValue = useMemo(
    () => ({
      unreadCount,
      markAsRead,
      markAllAsRead,
    }),
    [unreadCount, markAsRead, markAllAsRead],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
