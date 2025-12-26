"use client";

import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/types/user";
import { type PropsWithChildren, createContext } from "react";

const { useSession } = authClient;

export const AuthContext = createContext<{
  user: User | null | undefined;
  isLoading: boolean;
}>({
  user: undefined,
  isLoading: true,
});

function AuthProvider({ children }: PropsWithChildren) {
  const { data, error, isPending } = useSession();

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        title="Connection Error"
        className="min-h-screen"
      />
    );
  }

  if (isPending) {
    return <LoadingSkeleton />;
  }

  return (
    <AuthContext.Provider value={{ user: data?.user, isLoading: isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
