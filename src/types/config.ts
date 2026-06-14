/**
 * Central configuration interface for a scaffolded project.
 * Populated by interactive prompts and passed to all generators.
 */
export interface ProjectConfig {
  /** The project name (kebab-case, npm-compatible) */
  projectName: string;

  /** The npm package scope, e.g. "@my-project" */
  packageScope: string;

  /** Whether to include the Next.js web application */
  includeWeb: boolean;

  /** Whether to include the Expo mobile application */
  includeMobile: boolean;

  /** Whether to include the worker application */
  includeWorker: boolean;

  /** Whether to include Docker support (Dockerfiles + Compose) */
  includeDocker: boolean;

  /** Testing framework selection */
  testing: TestingOption;

  /** Database ORM selection (future-proofed) */
  database: DatabaseOption;

  /** Authentication strategy selection (future-proofed) */
  auth: AuthOption;

  /** Backend API framework */
  apiFramework: ApiFrameworkOption;

  /** Absolute path to the target directory for the generated project */
  targetDir: string;
}

export type TestingOption = 'none' | 'jest';

export type DatabaseOption = 'none' | 'prisma' | 'drizzle';

export type AuthOption = 'none' | 'jwt';

/**
 * Currently only 'nestjs' has a generator implementation.
 * TODO: Add 'hono' and 'adonis' here once their generators are implemented.
 */
export type ApiFrameworkOption = 'nestjs';
// Future: 'nestjs' | 'hono' | 'adonis'

/**
 * Metadata about an available API framework generator.
 * Used by the framework registry for extensibility.
 */
export interface FrameworkMeta {
  id: ApiFrameworkOption;
  name: string;
  description: string;
}

/**
 * Available framework registry.
 * New frameworks register here — add both the type above and an entry here.
 */
export const AVAILABLE_FRAMEWORKS: readonly FrameworkMeta[] = [
  {
    id: 'nestjs',
    name: 'NestJS',
    description: 'Full-featured, enterprise-grade Node.js framework with decorators and DI',
  },
  // Future entries:
  // { id: 'hono', name: 'Hono', description: 'Ultrafast web framework for the edge' },
  // { id: 'adonis', name: 'AdonisJS', description: 'Full-stack MVC framework for Node.js' },
] as const;
