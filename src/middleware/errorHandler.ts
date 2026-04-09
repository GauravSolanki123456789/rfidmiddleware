import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../errors/AppError.js";
import { HttpStatus } from "../errors/httpStatus.js";
import { Prisma } from "@prisma/client";

function formatZodError(err: ZodError) {
  return err.flatten();
}

/**
 * Single-line message for clients (mobile); keeps structured `details` for debugging.
 */
function zodUserFacingMessage(err: ZodError): string {
  const issues = err.issues;

  const mentionsBarcodeField = issues.some((i) =>
    i.path.some((seg) => {
      if (typeof seg !== "string") return false;
      return /^(scannedBarcodes|barcodes|barcode)$/i.test(seg);
    }),
  );
  const isEightDigitRule = issues.some((i) => /8\s*digits/i.test(i.message));
  if (mentionsBarcodeField && isEightDigitRule) {
    return "Invalid barcode: each value must be exactly 8 digits (0–9), with no spaces or letters.";
  }

  if (issues.length === 1 && issues[0]) {
    return issues[0].message;
  }

  const text = issues
    .map((i) => {
      const path = i.path.length ? `${i.path.join(".")}: ` : "";
      return `${path}${i.message}`;
    })
    .join(" ")
    .trim();
  return text || "Validation failed";
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
        message: zodUserFacingMessage(err),
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
