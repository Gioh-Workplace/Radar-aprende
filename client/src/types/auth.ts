export type UserRole =
  | "TEACHER"
  | "STUDENT";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string | null;
  registration?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}