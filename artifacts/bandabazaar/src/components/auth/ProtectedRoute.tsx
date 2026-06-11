import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth, type UserRole } from "@/context/AuthContext";

interface ProtectedRouteProps {
  component: React.ComponentType;
  roles: UserRole[];
  redirectTo: string;
}

export default function ProtectedRoute({ component: Component, roles, redirectTo }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !redirected.current && (!user || !roles.includes(user.role))) {
      redirected.current = true;
      setLocation(redirectTo);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) return null;

  return <Component />;
}
