import { Generator } from '../base/generator.js';
import { writeFiles } from '../../utils/fs.js';
import { join } from 'node:path';

/**
 * Next.js App Router generator.
 * Produces a minimal but production-ready Next.js web application
 * configured for the monorepo with shared package imports.
 */
export class WebGenerator extends Generator {
  readonly name = 'web';

  private get webDir(): string {
    return join(this.config.targetDir, 'apps', 'web');
  }

  protected async writeFiles(): Promise<void> {
    const files: Record<string, string> = {
      'package.json': this.packageJson(),
      'tsconfig.json': this.tsconfig(),
      'next.config.js': this.nextConfig(),
      'src/app/layout.tsx': this.layout(),
      'src/app/page.tsx': this.page(),
      'src/app/globals.css': this.globalsCss(),
      'src/app/providers.tsx': this.providers(),
      'src/lib/api-client.ts': this.apiClient(),
      'src/lib/env.ts': this.envTs(),
    };

    files['.env.example'] = this.webEnvExample();

    await writeFiles(this.webDir, files);
  }

  private packageJson(): string {
    const scope = this.config.packageScope;

    const pkg = {
      name: `${scope}/web`,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev --port 3000',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'type-check': 'tsc --noEmit',
      },
      dependencies: {
        'next': '^15.1.0',
        'react': '^19.0.0',
        'react-dom': '^19.0.0',
        [`${scope}/ui`]: 'workspace:*',
        [`${scope}/types`]: 'workspace:*',
        [`${scope}/utils`]: 'workspace:*',
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        'typescript': '^5.6.0',
        [`${scope}/config-typescript`]: 'workspace:*',
        [`${scope}/config-eslint`]: 'workspace:*',
      },
    };

    return JSON.stringify(pkg, null, 2) + '\n';
  }

  private tsconfig(): string {
    const tsconfig = {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'preserve',
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./src/*'],
        },
        allowJs: true,
        noEmit: true,
        incremental: true,
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };

    return JSON.stringify(tsconfig, null, 2) + '\n';
  }

  private nextConfig(): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable transpilation of monorepo packages
  transpilePackages: [
    '${this.config.packageScope}/ui',
    '${this.config.packageScope}/types',
    '${this.config.packageScope}/utils',
  ],
};

module.exports = nextConfig;
`;
  }

  private layout(): string {
    const { projectName } = this.config;
    const titleCase = projectName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return `import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: '${titleCase}',
  description: 'Built with KlackGenerate (Monorepo)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
`;
  }

  private page(): string {
    const { projectName } = this.config;
    const titleCase = projectName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return `export default function HomePage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        color: '#e2e8f0',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '640px', padding: '2rem' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
          }}
        >
          ${titleCase}
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2rem' }}>
          Your full-stack TypeScript monorepo is ready.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="http://localhost:3001/api/health"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'opacity 0.2s',
            }}
          >
            API Health →
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #334155',
              color: '#94a3b8',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'border-color 0.2s',
            }}
          >
            Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
`;
  }

  private globalsCss(): string {
    return `*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --background: #0f0f23;
  --foreground: #e2e8f0;
  --primary: #7c3aed;
  --secondary: #2563eb;
  --accent: #06b6d4;
  --muted: #94a3b8;
  --border: #334155;
}

html {
  color-scheme: dark;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
`;
  }

  private providers(): string {
    return `'use client';

/**
 * Client-side providers wrapper.
 * Add context providers here (theme, auth, query client, etc.)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;
  }

  private apiClient(): string {
    return `import { env } from './env';

/**
 * Type-safe API client for communicating with the backend.
 *
 * Usage:
 *   const users = await api.get('/users');
 *   const user = await api.post('/users', { email: '...', name: '...' });
 */
class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\\/$/, '');
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = \`\${this.baseUrl}\${path}\`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message ?? \`API request failed: \${response.status} \${response.statusText}\`,
      );
    }

    return response.json() as Promise<T>;
  }
}

export const api = new ApiClient(env.NEXT_PUBLIC_API_URL);
`;
  }

  private envTs(): string {
    return `/**
 * Client-side environment validation.
 * Only NEXT_PUBLIC_ prefixed variables are available in the browser.
 *
 * Validated at module load time — if a required variable is missing,
 * you'll get a clear error immediately.
 */
function getEnv() {
  const NEXT_PUBLIC_API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';
  const NEXT_PUBLIC_APP_NAME = process.env['NEXT_PUBLIC_APP_NAME'] ?? '${this.config.projectName}';

  return {
    NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME,
  } as const;
}

export const env = getEnv();
`;
  }

  private webEnvExample(): string {
    const { projectName } = this.config;
    return `# Web Environment Variables (Next.js)
# Copy to .env.local (Next.js convention — never committed).
# NEXT_PUBLIC_ prefix required for browser-accessible variables.

# ---- API ----
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# ---- App ----
NEXT_PUBLIC_APP_NAME=${projectName}
`;
  }
}
