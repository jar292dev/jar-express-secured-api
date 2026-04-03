export const ERROR_MESSAGES = {
  BAD_REQUEST: (message: string) => `Bad request: ${message}`,
  NOT_FOUND: (resource: string, id: string) => `${resource} with id "${id}" not found`,
  CONFLICT: (resource: string, field: string) => `${resource} with that ${field} already exists`,
  INTERNAL: 'An unexpected error occurred',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Must be a valid email address',
  INVALID_UUID: 'Must be a valid UUID',
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must be at most ${max} characters`,
  INVALID_ENUM: (field: string, values: string[]) =>
    `${field} must be one of: ${values.join(', ')}`,
} as const;
