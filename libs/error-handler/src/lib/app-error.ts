export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details: any;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    details: any = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this);
  }
}

// Not Found Error
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details: any = null) {
    super(message, 404, true, details);
  }
}

// Validation Error
export class ValidationError extends AppError {
  constructor(message = 'Validation error', details: any = null) {
    super(message, 422, true, details);
  }
}

// Authentication Error
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details: any = null) {
    super(message, 401, true, details);
  }
}

// Bad Request Error
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details: any = null) {
    super(message, 400, true, details);
  }
}

// Forbidden Error
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details: any = null) {
    super(message, 403, true, details);
  }
}

// Database Error
export class DatabaseError extends AppError {
  constructor(message = 'Database error', details: any = null) {
    super(message, 500, true, details);
  }
}

// Rate Limit Exceeded Error
export class RateLimitExceededError extends AppError {
  constructor(message = 'Rate limit exceeded', details: any = null) {
    super(message, 429, true, details);
  }
}

// Internal Server Error
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details: any = null) {
    super(message, 500, true, details);
  }
}
