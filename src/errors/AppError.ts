import type { HttpStatusCode } from "./httpStatus.js";
import { HttpStatus } from "./httpStatus.js";

export class AppError extends Error {
  readonly statusCode: HttpStatusCode;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    options?: { cause?: unknown; details?: unknown; isOperational?: boolean },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
