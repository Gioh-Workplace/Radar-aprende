import {
    Navigate,
    Outlet,
  } from "react-router";
  
  import { useAuth } from "../hooks/use-auth";
  import type { UserRole } from "../types/auth";
  
  interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
  }
  
  function getDashboardPath(
    role: UserRole,
  ): string {
    return role === "TEACHER"
      ? "/professor"
      : "/aluno";
  }
  
  export function ProtectedRoute({
    allowedRoles,
  }: ProtectedRouteProps) {
    const {
      user,
      isLoading,
    } = useAuth();
  
    if (isLoading) {
      return (
        <main className="loading-page">
          <p>Carregando sua sessão...</p>
        </main>
      );
    }
  
    if (!user) {
      return (
        <Navigate
          to="/login"
          replace
        />
      );
    }
  
    if (
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      return (
        <Navigate
          to={getDashboardPath(user.role)}
          replace
        />
      );
    }
  
    return <Outlet />;
  }