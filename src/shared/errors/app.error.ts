import { HTTP_STATUS, HttpStatus } from '../constants/http.constants';
import { ERROR_MESSAGES } from '../constants/messages.constants';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: HttpStatus,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(ERROR_MESSAGES.BAD_REQUEST(message), HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(ERROR_MESSAGES.NOT_FOUND(resource, id), HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, field: string) {
    super(ERROR_MESSAGES.CONFLICT(resource, field), HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }
}
