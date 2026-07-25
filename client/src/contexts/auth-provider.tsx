import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { apiRequest } from "../lib/api";
import {
  getAuthToken,
  removeAuthToken,
  saveAuthToken,
} from "../lib/auth-storage";
import type {
  AuthUser,
  LoginResponse,
  MeResponse,
} from "../types/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({
  children,
}: PropsWithChildren) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = getAuthToken();

      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const response =
          await apiRequest<MeResponse>(
            "/auth/me",
          );

        if (isMounted) {
          setUser(response.user);
        }
      } catch {
        removeAuthToken();

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (
      credential: string,
      password: string,
    ): Promise<AuthUser> => {
      const response =
        await apiRequest<LoginResponse>(
          "/auth/login",
          {
            method: "POST",
            authenticated: false,

            body: JSON.stringify({
              credential,
              password,
            }),
          },
        );

      saveAuthToken(response.token);
      setUser(response.user);

      return response.user;
    },
    [],
  );

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}