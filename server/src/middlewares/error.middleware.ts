import type {
    ErrorRequestHandler,
    RequestHandler,
  } from "express";
  import { ZodError } from "zod";
  
  import { AppError } from "../errors/app-error";
  
  interface ErrorWithCode extends Error {
    code?: number;
    keyValue?: Record<string, unknown>;
  }
  
  function isDuplicateKeyError(
    error: unknown,
  ): error is ErrorWithCode {
    return (
      error instanceof Error &&
      "code" in error &&
      error.code === 11000
    );
  }
  
  export const notFoundHandler: RequestHandler = (
    request,
    response,
  ) => {
    response.status(404).json({
      message: "Rota não encontrada.",
      method: request.method,
      path: request.originalUrl,
    });
  };
  
  export const errorHandler: ErrorRequestHandler = (
    error: unknown,
    _request,
    response,
    _next,
  ) => {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Dados da requisição inválidos.",
        code: "VALIDATION_ERROR",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
  
      return;
    }
  
    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
  
      return;
    }
  
    if (isDuplicateKeyError(error)) {
      response.status(409).json({
        message: "Já existe um cadastro com os dados informados.",
        code: "DUPLICATE_RESOURCE",
        fields: error.keyValue
          ? Object.keys(error.keyValue)
          : [],
      });
  
      return;
    }
  
    console.error("Unexpected application error:", error);
  
    response.status(500).json({
      message: "Ocorreu um erro interno no servidor.",
      code: "INTERNAL_SERVER_ERROR",
    });
  };