import type { AuthenticatedUser } from "../../types/auth.types";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export {};