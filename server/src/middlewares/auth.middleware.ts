import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  import jwt, {
    JsonWebTokenError,
    TokenExpiredError,
    type JwtPayload,
    type Secret,
  } from "jsonwebtoken";
  
  import { AppError } from "../errors/app-error";
  import { USER_ROLES } from "../models/user.model";
  import type { UserRole } from "../models/user.model";
  
  interface TokenPayload extends JwtPayload {
    role?: UserRole;
  }
  
  function getJwtSecret(): Secret {
    const secret = process.env.JWT_SECRET;
  
    if (!secret) {
      throw new Error("JWT_SECRET is not defined.");
    }
  
    return secret;
  }
  
  function isUserRole(value: unknown): value is UserRole {
    return (
      typeof value === "string" &&
      USER_ROLES.includes(value as UserRole)
    );
  }
  
  export function ensureAuthenticated(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    try {
      const authorization = request.headers.authorization;
  
      if (!authorization) {
        throw new AppError(
          401,
          "Token de autenticação não informado.",
          "TOKEN_MISSING",
        );
      }
  
      const [scheme, token] = authorization.split(" ");
  
      if (scheme !== "Bearer" || !token) {
        throw new AppError(
          401,
          "Formato do token inválido.",
          "INVALID_TOKEN_FORMAT",
        );
      }
  
      const payload = jwt.verify(
        token,
        getJwtSecret(),
      ) as TokenPayload;
  
      if (
        typeof payload.sub !== "string" ||
        !isUserRole(payload.role)
      ) {
        throw new AppError(
          401,
          "Conteúdo do token inválido.",
          "INVALID_TOKEN_PAYLOAD",
        );
      }
  
      request.auth = {
        userId: payload.sub,
        role: payload.role,
      };
  
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
  
      if (error instanceof TokenExpiredError) {
        next(
          new AppError(
            401,
            "O token de autenticação expirou.",
            "TOKEN_EXPIRED",
          ),
        );
        return;
      }
  
      if (error instanceof JsonWebTokenError) {
        next(
          new AppError(
            401,
            "Token de autenticação inválido.",
            "TOKEN_INVALID",
          ),
        );
        return;
      }
  
      next(error);
    }
  }