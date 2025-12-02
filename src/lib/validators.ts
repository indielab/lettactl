/**
 * Validates resource types for commands
 */
export function validateResourceType(resource: string, validTypes: string[]): void {
  if (!validTypes.includes(resource)) {
    console.error(`Error: Only "${validTypes.join('/')}" resource is currently supported`);
    process.exit(1);
  }
}

/**
 * Validates that a required parameter is provided
 */
export function validateRequired(value: any, paramName: string, usage?: string): void {
  if (!value) {
    console.error(`Error: ${paramName} is required`);
    if (usage) {
      console.error(`Usage: ${usage}`);
    }
    process.exit(1);
  }
}