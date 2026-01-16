// Replit Auth: Authentication hook
import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
