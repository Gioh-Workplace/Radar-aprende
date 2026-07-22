import type { UserRole } from "../models/user.model";

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}