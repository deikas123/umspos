"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  is_active?: boolean | null;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateAuthState: (state: Partial<AuthContextType>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  readonly children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // Start with undefined - don't assume any role until session is loaded
  const [userRole, setUserRole] = useState<string | null | undefined>(
    undefined
  );

  // Use Better Auth's useSession hook for reactive session data
  const {
    data: session,
    isPending: isSessionLoading,
    error: sessionError,
  } = authClient.useSession();

  const isLoading = isSessionLoading;
  const isAuthenticated = !!session?.user && !sessionError;

  const updateAuthState = useCallback((state: Partial<AuthContextType>) => {
    if (state.user !== undefined) setUser(state.user);
    if (state.userRole !== undefined) setUserRole(state.userRole);
  }, []);

  // Update user state when session changes - all data now in session.user
  useEffect(() => {
    // If session is still loading, wait
    if (isSessionLoading) return;

    // If no session or error, clear user state
    if (!session?.user || sessionError) {
      setUser(null);
      setUserRole(undefined);
      return;
    }

    // Custom fields are now directly in session.user
    const sessionUser = session.user as any;
    const isActive = sessionUser.isActive ?? true;

    if (isActive) {
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        name: sessionUser.displayName || session.user.name,
        role: sessionUser.appRole || "user",
        is_active: isActive,
      });
      setUserRole(sessionUser.appRole || "user");
    } else {
      // User is inactive, sign them out
      authClient.signOut();
      setUser(null);
      setUserRole(undefined);
    }
  }, [session, isSessionLoading, sessionError]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      userRole,
      isAuthenticated,
      isLoading,
      updateAuthState,
    }),
    [user, userRole, isAuthenticated, isLoading, updateAuthState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
