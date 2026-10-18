import type { ErrorRequestHandler } from 'express'

/**
 * Centralised error handler. In production we avoid leaking stack traces and
 * return a generic message for 500s. Operational errors (4xx) pass their
 * message through.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status =
    err && typeof err.status === 'number' && Number.isInteger(err.status) ? err.status : 500
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message ?? 'Request failed',
  })
}
