// Replit Auth: Utility to check for unauthorized errors
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
