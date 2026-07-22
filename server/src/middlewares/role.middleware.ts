import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import type { UserRole } from "../models/user.model";
  
  export function ensureRole(...allowedRoles: UserRole[]) {
    return function roleMiddleware(
      request: Request,
      _response: Response,
      next: NextFunction,
    ): void {
      if (!request.auth) {
        next(
          new AppError(
            401,
            "Usuário não autenticado.",
            "UNAUTHENTICATED",
          ),
        );
  
        return;
      }
  
      if (!allowedRoles.includes(request.auth.role)) {
        next(
          new AppError(
            403,
            "Você não possui permissão para executar esta ação.",
            "FORBIDDEN",
          ),
        );
  
        return;
      }
  
      next();
    };
  }