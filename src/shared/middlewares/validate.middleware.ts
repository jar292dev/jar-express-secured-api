import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { HTTP_STATUS } from '../constants/http.constants';
import { ApiError } from '../types/api.types';

export function validateBody(schema: ZodSchema<Record<string, unknown>>) {
  return (req: Request, res: Response<ApiError>, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.flatten(),
        },
      });
      return;
    }

    req.validatedBody = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema<Record<string, unknown>>) {
  return (req: Request, res: Response<ApiError>, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: result.error.flatten(),
        },
      });
      return;
    }

    req.validatedParams = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema<Record<string, unknown>>) {
  return (req: Request, res: Response<ApiError>, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: result.error.flatten(),
        },
      });
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
}
