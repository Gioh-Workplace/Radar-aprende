import { createContext } from "react";

import type { AuthUser } from "../types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login(
    credential: string,
    password: string,
  ): Promise<AuthUser>;

  logout(): void;
}

export const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );