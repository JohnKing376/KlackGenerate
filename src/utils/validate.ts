/**
 * Validate a project name against npm naming conventions.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateProjectName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Project name cannot be empty';
  }

  const trimmed = name.trim();

  if (trimmed.length > 214) {
    return 'Project name must be less than 214 characters';
  }

  if (trimmed.startsWith('.') || trimmed.startsWith('_')) {
    return 'Project name cannot start with a dot or underscore';
  }

  if (trimmed !== trimmed.toLowerCase()) {
    return 'Project name must be lowercase';
  }

  if (/\s/.test(trimmed)) {
    return 'Project name cannot contain spaces (use hyphens instead)';
  }

  // npm package name regex (simplified)
  const validPattern = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;
  if (!validPattern.test(trimmed)) {
    return 'Project name can only contain lowercase letters, numbers, hyphens, dots, and underscores';
  }

  // Reserved names
  const reserved = ['node_modules', 'favicon.ico', 'package', 'test', 'src', 'dist', 'build'];
  if (reserved.includes(trimmed)) {
    return `"${trimmed}" is a reserved name`;
  }

  return null;
}

/**
 * Convert a project name to an npm package scope.
 * e.g. "my-project" → "@my-project"
 */
export function toPackageScope(name: string): string {
  return `@${name}`;
}

/**
 * Convert a string to PascalCase.
 * e.g. "user-profiles" → "UserProfiles"
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a string to camelCase.
 * e.g. "user-profiles" → "userProfiles"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Pluralize a word (simple English rules).
 */
export function pluralize(word: string): string {
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
    return word + 'es';
  }
  if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
    return word.slice(0, -1) + 'ies';
  }
  return word + 's';
}

/**
 * Singularize a word (simple English rules).
 */
export function singularize(word: string): string {
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes') || word.endsWith('ches') || word.endsWith('shes')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}
