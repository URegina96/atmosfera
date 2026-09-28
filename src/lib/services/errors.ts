export type ErrorCode =
  | "BOOKING_CONFLICT"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CAPACITY_EXCEEDED"
  | "INVALID_DATES"
  | "INVALID_STATUS_TRANSITION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "PROPERTY_INACTIVE";

/** Mirrors the backend error envelope: { timestamp, status, code, message, details }. */
export class ApiError extends Error {
  readonly timestamp = new Date().toISOString();
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
  }
}

export const conflict = (message = "Выбранные даты уже заняты") => new ApiError(409, "BOOKING_CONFLICT", message);
export const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `${what} не найден`);
export const badRequest = (code: ErrorCode, message: string, details: string[] = []) =>
  new ApiError(400, code, message, details);
