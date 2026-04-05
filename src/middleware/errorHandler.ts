import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import { HttpStatus } from "../errors/httpStatus.js";
import { Prisma } from "@prisma/client";

function formatZodError(err: ZodError) {
  return err.flatten();
}

function prismaErrorMessage(err: Prisma.PrismaClientKnownRequestError): {
  status: number;
  message: string;
  details?: unknown;
} {
  switch (err.code) {
    case "P2002": {
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      return {
        status: HttpStatus.CONFLICT,
        message: target
          ? `Unique constraint failed on: ${target}`
          : "Unique constraint failed",
        details: err.meta,
      };
    }
    case "P2003":
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Foreign key constraint failed",
        details: err.meta,
      };
    case "P2025":
      return {
        status: HttpStatus.NOT_FOUND,
        message: "Record not found",
        details: err.meta,
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Database error",
        details: env.NODE_ENV === "development" ? err.meta : undefined,
      };
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    error: { message: "Not found" },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        message: "Validation failed",
        details: formatZodError(err),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { status, message, details } = prismaErrorMessage(err);
    res.status(status).json({
      success: false,
      error: { message, ...(details !== undefined ? { details } : {}) },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        message: "Invalid query or data",
        ...(env.NODE_ENV === "development" ? { details: err.message } : {}),
      },
    });
    return;
  }

  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  if (env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: { message },
  });
}
