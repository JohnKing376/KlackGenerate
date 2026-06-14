import { Generator } from '../base/generator.js';
import { writeFiles } from '../../utils/fs.js';
import { join } from 'node:path';

/**
 * Shared packages generator.
 * Produces all packages/* workspace packages:
 * - ui, types, utils, email
 * - config-typescript, config-eslint, config-prettier
 */
export class PackagesGenerator extends Generator {
  readonly name = 'packages';

  private get pkgDir(): string {
    return join(this.config.targetDir, 'packages');
  }

  protected async writeFiles(): Promise<void> {
    await Promise.all([
      this.writeUiPackage(),
      this.writeTypesPackage(),
      this.writeUtilsPackage(),
      this.writeEmailPackage(),
      this.writeConfigTypescript(),
      this.writeConfigEslint(),
      this.writeConfigPrettier(),
    ]);
  }

  // ─── UI Package ────────────────────────────────────────────────────────

  private async writeUiPackage(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'ui');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/ui`,
          version: '0.1.0',
          private: true,
          main: './src/index.ts',
          types: './src/index.ts',
          scripts: {
            build: 'tsc',
            lint: 'eslint "src/**/*.{ts,tsx}"',
            'type-check': 'tsc --noEmit',
          },
          dependencies: {
            react: '^19.0.0',
          },
          devDependencies: {
            '@types/react': '^19.0.0',
            typescript: '^5.6.0',
            [`${scope}/config-typescript`]: 'workspace:*',
          },
          peerDependencies: {
            react: '>=18.0.0',
          },
        },
        null,
        2,
      ) + '\n',

      'tsconfig.json': JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            jsx: 'react-jsx',
            outDir: './dist',
            rootDir: './src',
            module: 'ESNext',
            moduleResolution: 'Bundler',
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2,
      ) + '\n',

      'src/index.ts': `// Shared UI Components
// Export all reusable components from this package.

export { Button } from './components/button';
export type { ButtonProps } from './components/button';
`,

      'src/components/button.tsx': `import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is in a loading state */
  loading?: boolean;
}

/**
 * Shared Button component.
 * Used across web and mobile applications.
 *
 * @example
 *   <Button variant="primary" onClick={handleSubmit}>
 *     Submit
 *   </Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
`,
    };

    await writeFiles(dir, files);
  }

  // ─── Types Package ─────────────────────────────────────────────────────

  private async writeTypesPackage(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'types');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/types`,
          version: '0.1.0',
          private: true,
          main: './src/index.ts',
          types: './src/index.ts',
          scripts: {
            lint: 'eslint "src/**/*.ts"',
            'type-check': 'tsc --noEmit',
          },
          dependencies: {
            zod: '^3.23.0',
          },
          devDependencies: {
            typescript: '^5.6.0',
            [`${scope}/config-typescript`]: 'workspace:*',
          },
        },
        null,
        2,
      ) + '\n',

      'tsconfig.json': JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2,
      ) + '\n',

      'src/index.ts': `// Shared Types
// Export all shared types, interfaces, and Zod schemas from here.

export type { ApiResponse, ApiError, PaginatedResponse } from './api.types';
export type { User, CreateUserInput, UpdateUserInput } from './user.types';
export type { Id, Timestamp, Nullable } from './common.types';
`,

      'src/api.types.ts': `/**
 * Standard API response envelope.
 * All API responses are wrapped in this shape.
 */
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

/**
 * Standard API error response.
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Paginated response shape.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
`,

      'src/user.types.ts': `/**
 * Shared user types.
 * Used across API, web, and mobile applications.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}
`,

      'src/common.types.ts': `/**
 * Common utility types shared across the monorepo.
 */

/** UUID string type */
export type Id = string;

/** ISO 8601 timestamp string */
export type Timestamp = string;

/** Makes a type nullable */
export type Nullable<T> = T | null;

/** Makes all properties of T optional and nullable */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] | null;
};

/** Extract the resolved type from a Promise */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
`,
    };

    await writeFiles(dir, files);
  }

  // ─── Utils Package ─────────────────────────────────────────────────────

  private async writeUtilsPackage(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'utils');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/utils`,
          version: '0.1.0',
          private: true,
          main: './src/index.ts',
          types: './src/index.ts',
          scripts: {
            lint: 'eslint "src/**/*.ts"',
            'type-check': 'tsc --noEmit',
          },
          devDependencies: {
            typescript: '^5.6.0',
            [`${scope}/config-typescript`]: 'workspace:*',
          },
        },
        null,
        2,
      ) + '\n',

      'tsconfig.json': JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2,
      ) + '\n',

      'src/index.ts': `// Shared Utilities
// Export all general-purpose utility functions from here.

export { formatDate, formatRelativeTime, isValidDate } from './format';
export { sleep, retry, chunk, uniqueBy } from './helpers';
export { APP_NAME, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';
`,

      'src/format.ts': `/**
 * Format a date to a human-readable string.
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return \`\${diffMins} minute\${diffMins > 1 ? 's' : ''} ago\`;
  if (diffHours < 24) return \`\${diffHours} hour\${diffHours > 1 ? 's' : ''} ago\`;
  if (diffDays < 30) return \`\${diffDays} day\${diffDays > 1 ? 's' : ''} ago\`;

  return formatDate(d);
}

/**
 * Check if a string is a valid date.
 */
export function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}
`,

      'src/helpers.ts': `/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function a given number of times.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await sleep(delayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Split an array into chunks of a given size.
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Remove duplicate items from an array based on a key function.
 */
export function uniqueBy<T>(array: T[], keyFn: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
`,

      'src/constants.ts': `/**
 * Shared constants used across the monorepo.
 */

export const APP_NAME = '${this.config.projectName}';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
`,
    };

    await writeFiles(dir, files);
  }

  // ─── Email Package ─────────────────────────────────────────────────────

  private async writeEmailPackage(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'email');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/email`,
          version: '0.1.0',
          private: true,
          main: './src/index.ts',
          types: './src/index.ts',
          scripts: {
            lint: 'eslint "src/**/*.ts"',
            'type-check': 'tsc --noEmit',
          },
          devDependencies: {
            typescript: '^5.6.0',
            [`${scope}/config-typescript`]: 'workspace:*',
          },
        },
        null,
        2,
      ) + '\n',

      'tsconfig.json': JSON.stringify(
        {
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            outDir: './dist',
            rootDir: './src',
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2,
      ) + '\n',

      'src/index.ts': `// Email Package
// Export email templates and the send function.

export { sendEmail } from './send';
export type { EmailOptions, EmailResult } from './send';
export { welcomeEmailTemplate } from './templates/welcome';
`,

      'src/send.ts': `/**
 * Email sending abstraction.
 *
 * Replace the implementation with your email provider:
 * - Resend
 * - SendGrid
 * - AWS SES
 * - Nodemailer
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email.
 *
 * Currently a placeholder — replace with your email provider.
 *
 * @example
 *   import { sendEmail, welcomeEmailTemplate } from '${this.config.packageScope}/email';
 *
 *   await sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Welcome!',
 *     html: welcomeEmailTemplate({ name: 'John' }),
 *   });
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // TODO: Replace with actual email provider implementation
  console.log(\`[Email] Would send to \${options.to}: \${options.subject}\`);

  return {
    success: true,
    messageId: \`mock-\${Date.now()}\`,
  };
}
`,

      'src/templates/welcome.ts': `/**
 * Welcome email template.
 *
 * @example
 *   const html = welcomeEmailTemplate({ name: 'John', appName: 'MyApp' });
 */
export function welcomeEmailTemplate(params: {
  name: string;
  appName?: string;
}): string {
  const { name, appName = '${this.config.projectName}' } = params;

  return \`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to \${appName}</title>
      </head>
      <body style="
        margin: 0;
        padding: 0;
        background-color: #0f0f23;
        font-family: system-ui, -apple-system, sans-serif;
        color: #e2e8f0;
      ">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 24px;
        ">
          <h1 style="
            color: #7c3aed;
            font-size: 24px;
            margin-bottom: 16px;
          ">
            Welcome to \${appName}, \${name}!
          </h1>
          <p style="
            font-size: 16px;
            line-height: 1.6;
            color: #94a3b8;
          ">
            We're excited to have you on board. Your account has been created
            and you're ready to get started.
          </p>
          <a
            href="#"
            style="
              display: inline-block;
              margin-top: 24px;
              padding: 12px 24px;
              background: linear-gradient(135deg, #7c3aed, #2563eb);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            "
          >
            Get Started →
          </a>
        </div>
      </body>
    </html>
  \`;
}
`,
    };

    await writeFiles(dir, files);
  }

  // ─── Config: TypeScript ────────────────────────────────────────────────

  private async writeConfigTypescript(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'config-typescript');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/config-typescript`,
          version: '0.1.0',
          private: true,
          files: ['base.json', 'nextjs.json', 'nestjs.json', 'react-native.json'],
        },
        null,
        2,
      ) + '\n',

      'base.json': JSON.stringify(
        {
          $schema: 'https://json.schemastore.org/tsconfig',
          compilerOptions: {
            target: 'ES2022',
            lib: ['ES2022'],
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            isolatedModules: true,
            declaration: true,
            declarationMap: true,
            sourceMap: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noImplicitReturns: true,
            noFallthroughCasesInSwitch: true,
          },
          exclude: ['node_modules', 'dist', 'build'],
        },
        null,
        2,
      ) + '\n',

      'nextjs.json': JSON.stringify(
        {
          $schema: 'https://json.schemastore.org/tsconfig',
          extends: './base.json',
          compilerOptions: {
            target: 'ES2017',
            lib: ['dom', 'dom.iterable', 'esnext'],
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'preserve',
            noEmit: true,
            incremental: true,
            allowJs: true,
          },
        },
        null,
        2,
      ) + '\n',

      'nestjs.json': JSON.stringify(
        {
          $schema: 'https://json.schemastore.org/tsconfig',
          extends: './base.json',
          compilerOptions: {
            module: 'CommonJS',
            moduleResolution: 'Node',
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            declaration: false,
            declarationMap: false,
          },
        },
        null,
        2,
      ) + '\n',

      'react-native.json': JSON.stringify(
        {
          $schema: 'https://json.schemastore.org/tsconfig',
          extends: './base.json',
          compilerOptions: {
            target: 'ESNext',
            lib: ['ESNext'],
            module: 'ESNext',
            moduleResolution: 'Bundler',
            jsx: 'react-jsx',
            noEmit: true,
          },
        },
        null,
        2,
      ) + '\n',
    };

    await writeFiles(dir, files);
  }

  // ─── Config: ESLint ────────────────────────────────────────────────────

  private async writeConfigEslint(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'config-eslint');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/config-eslint`,
          version: '0.1.0',
          private: true,
          main: 'index.js',
          exports: {
            '.': './index.js',
            './flat': './flat.js',
            './next': './next.js',
            './nest': './nest.js',
          },
          files: ['index.js', 'flat.js', 'next.js', 'nest.js'],
          dependencies: {
            '@typescript-eslint/eslint-plugin': '^8.0.0',
            '@typescript-eslint/parser': '^8.0.0',
            'typescript-eslint': '^8.0.0',
            'eslint-config-prettier': '^9.1.0',
          },
          peerDependencies: {
            eslint: '>=8.0.0',
          },
        },
        null,
        2,
      ) + '\n',

      // ─── Flat config (ESLint v9+) ──────────────────────────────────────────
      'flat.js': `const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**', '.expo/**'],
  },
];
`,

      // ─── Legacy config (ESLint v8 compatibility shim) ────────────────────
      'index.js': `/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '.next/', '.expo/'],
};
`,

      'next.js': `/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './index.js',
    'next/core-web-vitals',
  ],
  rules: {
    'react/no-unescaped-entities': 'off',
  },
};
`,

      'nest.js': `/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  rules: {
    // NestJS uses empty constructors for DI
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    // Allow any for decorators
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
`,
    };

    await writeFiles(dir, files);
  }

  // ─── Config: Prettier ──────────────────────────────────────────────────

  private async writeConfigPrettier(): Promise<void> {
    const scope = this.config.packageScope;
    const dir = join(this.pkgDir, 'config-prettier');

    const files: Record<string, string> = {
      'package.json': JSON.stringify(
        {
          name: `${scope}/config-prettier`,
          version: '0.1.0',
          private: true,
          main: 'index.js',
          files: ['index.js'],
        },
        null,
        2,
      ) + '\n',

      'index.js': `/** @type {import('prettier').Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};
`,
    };

    await writeFiles(dir, files);
  }
}
