/**
 * Error Handler Middleware Tests
 */
import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, NotFoundError, AuthError } from '../../utils/errors';

jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

const { errorHandler } = require('../../middleware/errorHandler');

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json = jest.fn().mockReturnValue(res as Response);
  return res;
};

const createMockReq = (overrides: Partial<Request> = {}): Partial<Request> => ({
  path: '/test',
  method: 'GET',
  ...overrides,
});

describe('Error Handler Middleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockReq() as Request;
    res = createMockRes() as Response;
    next = jest.fn();
  });

  test('should handle AppError with correct status code', () => {
    const err = new AppError('Custom error', 422, 'CUSTOM_ERROR');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'CUSTOM_ERROR',
          message: 'Custom error',
        }),
      }),
    );
  });

  test('should handle ValidationError as 400', () => {
    const err = new ValidationError('Invalid input');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('should handle NotFoundError as 404', () => {
    const err = new NotFoundError('Resource not found');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should handle AuthError as 401', () => {
    const err = new AuthError('Unauthorized');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should handle generic Error as 500', () => {
    const err = new Error('Something went wrong');
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('should handle JWT TokenExpiredError', () => {
    const err: any = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should handle JWT JsonWebTokenError', () => {
    const err: any = new Error('invalid token');
    err.name = 'JsonWebTokenError';
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should include timestamp and path in response', () => {
    const err = new AppError('Test error', 400);
    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          path: '/test',
          timestamp: expect.any(String),
        }),
      }),
    );
  });
});
