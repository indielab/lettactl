/**
 * Wraps command functions with consistent error handling
 */
export function withErrorHandling<T extends any[], R>(
  commandName: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      console.error(`${commandName} failed:`, error.message || error);
      process.exit(1);
    }
  };
}

/**
 * Creates a consistent error for resource not found
 */
export function createNotFoundError(resourceType: string, name: string): Error {
  return new Error(`${resourceType} "${name}" not found`);
}