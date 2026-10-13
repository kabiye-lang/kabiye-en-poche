import { HttpError } from 'ra-core'

/**
 * A failed Supabase read as an HttpError that keeps the response status, so a 401 or
 * 403 still reaches the auth provider, which signs the admin out.
 */
export function readFailure(error: { message: string }, status: number): HttpError {
  return new HttpError(error.message, status, error)
}
