import { Generator } from '../base/generator.js';
import { writeFiles } from '../../utils/fs.js';
import { generateGitignore } from '../../utils/git.js';


/**
 * Generates all root-level monorepo configuration files:
 * package.json, turbo.json, tsconfig.base.json, bunfig.toml,
 * .env.example, .gitignore, .prettierrc, README.md, ARCHITECTURE.md
 */
export class RootGenerator extends Generator {
  readonly name = 'root';

  protected async writeFiles(): Promise<void> {
    const files: Record<string, string> = {
      'package.json': this.generatePackageJson(),
      'turbo.json': this.generateTurboJson(),
      'tsconfig.base.json': this.generateTsConfigBase(),
      'bunfig.toml': this.generateBunfigToml(),
      '.env.example': this.generateEnvExample(),
      '.gitignore': generateGitignore(),
      '.prettierrc': this.generatePrettierRc(),
      '.eslintrc.js': this.generateEslintRc(),
      '.lintstagedrc.json': this.generateLintStaged(),
      '.husky/pre-commit': this.generateHuskyPreCommit(),
      '.husky/pre-push': this.generateHuskyPrePush(),
      '.github/workflows/ci.yml': this.generateCiWorkflow(),
      '.github/workflows/release.yml': this.generateReleaseWorkflow(),
      'README.md': this.generateReadme(),
      'ARCHITECTURE.md': this.generateArchitecture(),
    };

    if (this.config.includeDocker) {
      files['docker-compose.yml'] = this.generateDockerCompose();
      files['.dockerignore'] = this.generateDockerIgnore();
    }

    await writeFiles(this.config.targetDir, files);
  }

  private generatePackageJson(): string {
    const workspaces = ['apps/*', 'packages/*'];

    const scripts: Record<string, string> = {
      'dev': 'turbo dev',
      'build': 'turbo build',
      'lint': 'turbo lint',
      'type-check': 'turbo type-check',
      'clean': 'turbo clean',
      'format': 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"',
      'format:check': 'prettier --check "**/*.{ts,tsx,js,jsx,json,md}"',
      'env:encrypt': 'dotenvx encrypt',
      'env:decrypt': 'dotenvx decrypt',
      'prepare': 'husky',
    };

    if (this.config.testing !== 'none') {
      scripts['test'] = 'turbo test';
    }

    const devDependencies: Record<string, string> = {
      'turbo': '^2.3.0',
      'typescript': '^5.6.0',
      'prettier': '^3.4.0',
      '@dotenvx/dotenvx': '^1.0.0',
      'husky': '^9.0.0',
      'lint-staged': '^15.0.0',
      [`${this.config.packageScope}/config-prettier`]: 'workspace:*',
      [`${this.config.packageScope}/config-eslint`]: 'workspace:*',
      [`${this.config.packageScope}/config-typescript`]: 'workspace:*',
    };

    const pkg = {
      name: this.config.projectName,
      version: '0.1.0',
      private: true,
      workspaces,
      scripts,
      devDependencies,
      packageManager: 'bun@1.1.0',
    };

    return JSON.stringify(pkg, null, 2) + '\n';
  }

  private generateTurboJson(): string {
    const tasks: Record<string, object> = {
      'build': {
        dependsOn: ['^build'],
        outputs: ['.next/**', '!.next/cache/**', 'dist/**'],
      },
      'lint': {
        dependsOn: ['^lint'],
        outputs: [],
      },
      'type-check': {
        dependsOn: ['^build'],
        outputs: [],
      },
      'dev': {
        cache: false,
        persistent: true,
      },
      'clean': {
        cache: false,
      },
    };

    if (this.config.testing !== 'none') {
      tasks['test'] = {
        dependsOn: ['^build'],
        outputs: ['coverage/**'],
      };
    }

    const turbo = {
      $schema: 'https://turbo.build/schema.json',
      tasks,
    };

    return JSON.stringify(turbo, null, 2) + '\n';
  }

  private generateTsConfigBase(): string {
    const tsconfig = {
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
      exclude: ['node_modules', 'dist', 'build', '.next', '.expo'],
    };

    return JSON.stringify(tsconfig, null, 2) + '\n';
  }

  private generateBunfigToml(): string {
    return `# Bun configuration
# See: https://bun.sh/docs/runtime/bunfig

[install]
# Use exact versions by default
exact = true

[install.lockfile]
# Save the lockfile
save = true
`;
  }

  private generateEnvExample(): string {
    const { projectName, includeWeb } = this.config;
    return `# ==============================================
# ${projectName} â€” Root Environment Variables
# ==============================================
#
# SETUP:
#   1. Copy this file to .env
#   2. Fill in your values
#   3. Run \`bun run env:encrypt\` to produce .env.vault (safe to commit)
#
# TEAM WORKFLOW:
#   - Commit .env.vault (encrypted) instead of .env
#   - Share DOTENV_KEY securely (e.g., 1Password, GitHub Secrets)
#   - CI uses DOTENV_KEY env var to decrypt at runtime
#
# NEVER commit .env files or .env.keys to version control.
# ==============================================

# ---- Application ----
NODE_ENV=development
${includeWeb ? 'NEXT_PUBLIC_APP_NAME=' + projectName + '\n' : ''}
# ---- CI/CD ----
# DOTENV_KEY=          # Set in GitHub Actions secrets
`;
  }

  private generatePrettierRc(): string {
    return JSON.stringify(`${this.config.packageScope}/config-prettier`) + '\n';
  }

  private generateEslintRc(): string {
    return `/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['${this.config.packageScope}/config-eslint'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
};
`;
  }

  private generateLintStaged(): string {
    return JSON.stringify(
      {
        '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
        '*.{js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
        '*.{json,md,yml,yaml}': ['prettier --write'],
      },
      null,
      2,
    ) + '\n';
  }

  private generateHuskyPreCommit(): string {
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "ðŸ” Running lint-staged on staged files..."
bunx lint-staged
`;
  }

  private generateHuskyPrePush(): string {
    const { testing } = this.config;
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "ðŸ” Running pre-push quality checks..."

bun run type-check
if [ $? -ne 0 ]; then
  echo "âŒ Type check failed. Push aborted."
  exit 1
fi
echo "âœ… Type check passed"

bun run lint
if [ $? -ne 0 ]; then
  echo "âŒ Lint failed. Push aborted."
  exit 1
fi
echo "âœ… Lint passed"
${testing !== 'none' ? `
bun run test
if [ $? -ne 0 ]; then
  echo "âŒ Tests failed. Push aborted."
  exit 1
fi
echo "âœ… Tests passed"
` : ''}
echo "âœ… All pre-push checks passed!"
`;
  }

  private generateCiWorkflow(): string {
    const { testing } = this.config;
    return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality (Node \${{ matrix.node-version }})
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Setup Node \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.bun/install/cache
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: \${{ runner.os }}-bun-\${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            \${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Type check
        run: bun run type-check

      - name: Lint
        run: bun run lint

      - name: Build
        run: bun run build
${testing !== 'none' ? `
      - name: Test
        run: bun run test
` : ''}
`;
  }

  private generateReleaseWorkflow(): string {
    const dockerSection = this.config.includeDocker
      ? `
  docker:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    needs: [quality]
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/\${{ github.repository }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`
      : '';

    return `name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  quality:
    name: Quality Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run type-check
      - run: bun run lint
      - run: bun run build
${dockerSection}
`;
  }

  private generateDockerCompose(): string {
    const { projectName, includeWorker, database } = this.config;

    const services: string[] = [];

    if (database === 'prisma' || database === 'drizzle') {
      services.push(`  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${projectName.replace(/-/g, '_')}_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5`);
    }

    services.push(`  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5`);

    const apiDepends = ['redis'];
    if (database === 'prisma' || database === 'drizzle') apiDepends.push('postgres');

    services.push(`  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: development
    restart: unless-stopped
    ports:
      - '3001:3001'
    env_file:
      - apps/api/.env
    depends_on:
      ${apiDepends.map((d) => `${d}:\n          condition: service_healthy`).join('\n      ')}
    volumes:
      - ./apps/api/src:/app/apps/api/src
      - ./packages:/app/packages`);

    if (includeWorker) {
      services.push(`  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
      target: development
    restart: unless-stopped
    env_file:
      - apps/worker/.env
    environment:
      WORKER_ENABLED: 'true'
    depends_on:
      redis:
        condition: service_healthy`);
    }

    const volumes = [];
    if (database === 'prisma' || database === 'drizzle') {
      volumes.push('  postgres_data:');
    }

    return `version: '3.8'

# ${projectName} â€” Local Development Stack
# Usage:
#   docker compose up          # Start all services
#   docker compose up -d       # Start in background
#   docker compose down        # Stop (keep volumes)
#   docker compose down -v     # Stop + wipe data

services:
${services.join('\n\n')}

${volumes.length > 0 ? `volumes:\n${volumes.join('\n')}\n` : ''}`;
  }

  private generateDockerIgnore(): string {
    return `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.expo/
out/

# Environment files
.env
.env.local
.env.*.local
.env.keys

# Development tools
.git/
.gitignore
.husky/
.github/

# Docs
*.md
LICENSE

# IDE
.vscode/
.idea/

# Test artifacts
coverage/
*.log
`;
  }

  private generateReadme(): string {
    const { projectName, packageScope, includeWeb, includeMobile, includeWorker, includeDocker, testing } = this.config;

    let appsTable = `| App | Description | Port |
|-----|-------------|------|
| \`apps/api\` | NestJS API server | 3001 |`;

    if (includeWeb) {
      appsTable += `\n| \`apps/web\` | Next.js web application | 3000 |`;
    }
    if (includeMobile) {
      appsTable += `\n| \`apps/mobile\` | Expo React Native app | 8081 |`;
    }
    if (includeWorker) {
      appsTable += `\n| \`apps/worker\` | Background job processor | â€” |`;
    }

    return `# ${projectName}

A production-grade full-stack TypeScript monorepo scaffolded by [KlackGenerate (Monorepo)](https://github.com).

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Monorepo**: [Turborepo](https://turbo.build)
- **API**: [NestJS](https://nestjs.com)
${includeWeb ? '- **Web**: [Next.js](https://nextjs.org) (App Router)\n' : ''}${includeMobile ? '- **Mobile**: [Expo](https://expo.dev) + React Native\n' : ''}${includeDocker ? '- **Containers**: Docker + Docker Compose\n' : ''}- **Language**: TypeScript (strict mode)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- [Node.js](https://nodejs.org) >= 18.0.0
${includeDocker ? '- [Docker](https://docker.com) >= 24.0 *(for containerised workflow)*\n' : ''}
### Option A â€” Docker (Recommended)

\`\`\`bash
# Start the full stack (API + Postgres + Redis${includeWorker ? ' + Worker' : ''})
docker compose up
\`\`\`

### Option B â€” Local

\`\`\`bash
# Install dependencies
bun install

# Copy environment files
cp apps/api/.env.example apps/api/.env
${includeWeb ? 'cp apps/web/.env.example apps/web/.env.local\n' : ''}${includeWorker ? 'cp apps/worker/.env.example apps/worker/.env\n' : ''}
# Start all apps in development mode
bun run dev
\`\`\`

### Individual Apps

\`\`\`bash
bun run dev --filter=api${includeWeb ? '\nbun run dev --filter=web' : ''}${includeMobile ? '\nbun run dev --filter=mobile' : ''}
\`\`\`

## Environment Variables

This project uses [dotenvx](https://dotenvx.com) for environment management.
Each app has its own \`.env.example\`:

| App | Example File |
|-----|--------------|
| \`apps/api\` | \`apps/api/.env.example\` |
${includeWeb ? '| `apps/web` | `apps/web/.env.example` |\n' : ''}${includeWorker ? '| `apps/worker` | `apps/worker/.env.example` |\n' : ''}
\`\`\`bash
# Encrypt secrets for safe team sharing
bun run env:encrypt

# Decrypt secrets (requires DOTENV_KEY)
bun run env:decrypt
\`\`\`

> Never commit \`.env\` files or \`.env.keys\`. Commit \`.env.vault\` instead.

## Project Structure

${appsTable}

### Shared Packages

| Package | Description |
|---------|-------------|
| \`${packageScope}/ui\` | Shared UI components |
| \`${packageScope}/types\` | Shared TypeScript types and Zod schemas |
| \`${packageScope}/utils\` | General utilities and helpers |
| \`${packageScope}/email\` | Email templates and utilities |
| \`${packageScope}/config-typescript\` | Shared TypeScript configs |
| \`${packageScope}/config-eslint\` | Shared ESLint configs |
| \`${packageScope}/config-prettier\` | Shared Prettier configs |

## Scripts

| Command | Description |
|---------|-------------|
| \`bun run dev\` | Start all apps in development mode |
| \`bun run build\` | Build all apps and packages |
| \`bun run lint\` | Lint all apps and packages |
| \`bun run type-check\` | Type-check all apps and packages |
| \`bun run format\` | Format all files with Prettier |
| \`bun run clean\` | Remove all build artifacts |
| \`bun run env:encrypt\` | Encrypt .env files with dotenvx |
| \`bun run env:decrypt\` | Decrypt .env.vault files |
${testing !== 'none' ? '| `bun run test` | Run all tests |\n' : ''}
## CI/CD

GitHub Actions workflows are in \`.github/workflows/\`:

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| \`ci.yml\` | Push / PR | Type-check, lint, build${testing !== 'none' ? ', test' : ''} on Node 18/20/22 |
| \`release.yml\` | Push \`v*.*.*\` tag | ${includeDocker ? 'Builds Docker image, pushes to GHCR' : 'Quality gate on release tags'} |
${includeDocker ? `
## Docker

\`\`\`bash
docker compose up          # Start all services
docker compose up -d       # Start in background
docker compose down        # Stop (keep volumes)
docker compose down -v     # Stop + wipe data
\`\`\`

| Service | Port |
|---------|------|
| \`api\` | 3001 |
| \`postgres\` | 5432 |
| \`redis\` | 6379 |
` : ''}
## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## License

MIT
`;
  }

  private generateArchitecture(): string {
    const { projectName, packageScope, includeWeb, includeMobile, includeWorker, includeDocker, testing } = this.config;

    const tocDockerEntry = includeDocker ? '10. [Docker Architecture](#docker-architecture)\n' : '';
    const webEnvRow = includeWeb ? '| `apps/web` | `apps/web/.env.example` | Next.js built-in (`NEXT_PUBLIC_*`) |\n' : '';
    const workerEnvRow = includeWorker ? '| `apps/worker` | `apps/worker/.env.example` | dotenvx |\n' : '';
    const testSuffix = testing !== 'none' ? ' â†’ test' : '';
    const testHookNote = testing !== 'none' ? ' + \\`test\\`' : '';

    const dockerReleaseBlock = includeDocker
      ? `\n\\\`\\\`\\\`\nTag pushed (v*.*.*)\n  â””â”€â”€ release.yml triggers\n        â”œâ”€â”€ Quality gate (type-check â†’ lint â†’ build)\n        â”œâ”€â”€ Build apps/api Docker image\n        â”œâ”€â”€ Tag as ghcr.io/<owner>/<project>:latest\n        â”œâ”€â”€ Tag as ghcr.io/<owner>/<project>:<version>\n        â””â”€â”€ Push to GitHub Container Registry (GHCR)\n\\\`\\\`\\\`\n`
      : '';

    const workerServiceLine = includeWorker ? '\n          â””â”€â”€ worker (depends_on: redis)' : '';
    const dockerArchSection = includeDocker
      ? `\n---\n\n## Docker Architecture\n\n### Multi-Stage Build (apps/api/Dockerfile)\n\n\\\`\\\`\\\`\nStage 1 â€” builder\n  â”œâ”€â”€ node:20-alpine base\n  â”œâ”€â”€ Install all dependencies (devDeps included)\n  â””â”€â”€ Compile TypeScript â†’ dist/\n\nStage 2 â€” production  (~150MB final image)\n  â”œâ”€â”€ node:20-alpine base (clean)\n  â”œâ”€â”€ Copy dist/ from builder\n  â”œâ”€â”€ Copy production node_modules from builder\n  â””â”€â”€ CMD ["node", "dist/main.js"]\n\nStage 3 â€” development\n  â””â”€â”€ Uses builder stage + runs live reload via Bun\n\\\`\\\`\\\`\n\nThe two-stage build ensures dev tools (TypeScript, NestJS CLI, etc.) never reach production.\n\n### docker-compose.yml â€” Service Graph\n\n\\\`\\\`\\\`\npostgres â”€â”\n          â”œâ”€â”€ api (depends_on: postgres, redis)\nredis    â”€â”¤${workerServiceLine}\n\\\`\\\`\\\`\n\n### Volume Strategy\n\n- \\\`postgres_data\\\` â€” named volume, persists across restarts\n- \\\`./apps/api/src\\\` â€” bind-mounted in dev mode for hot-reload\n`
      : '';

    return `# ${projectName} â€” Architecture

## Table of Contents

1. [Overview](#overview)
2. [Monorepo Structure](#monorepo-structure)
3. [Architectural Philosophy](#architectural-philosophy)
4. [API Architecture (NestJS)](#api-architecture-nestjs)
5. [Layer Responsibilities](#layer-responsibilities)
6. [Shared Packages](#shared-packages)
7. [Environment Configuration](#environment-configuration)
8. [Pre-Push Quality Gate](#pre-push-quality-gate)
9. [CI/CD Pipeline](#cicd-pipeline)
${tocDockerEntry}10. [Adding a New Feature](#adding-a-new-feature)
11. [Code Conventions](#code-conventions)

---

## Overview

This is a **full-stack TypeScript monorepo** managed with **Bun workspaces** and orchestrated by **Turborepo**. Every package and application uses TypeScript in strict mode. Shared code is extracted into reusable packages under \`packages/\`.

---

## Monorepo Structure

\`\`\`
${projectName}/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/                    # NestJS REST API
${includeWeb ? 'â”‚   â”œâ”€â”€ web/                    # Next.js web application (App Router)\n' : ''}${includeMobile ? 'â”‚   â”œâ”€â”€ mobile/                 # Expo + React Native mobile app\n' : ''}${includeWorker ? 'â”‚   â””â”€â”€ worker/                 # Background job processor (dormant)\n' : ''}â”‚
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ ui/                     # Shared UI components
â”‚   â”œâ”€â”€ types/                  # Shared TypeScript types & Zod schemas
â”‚   â”œâ”€â”€ utils/                  # General utility functions
â”‚   â”œâ”€â”€ email/                  # Email templates & sending
â”‚   â”œâ”€â”€ config-eslint/          # Shared ESLint configuration
â”‚   â”œâ”€â”€ config-typescript/      # Shared TypeScript configuration
â”‚   â””â”€â”€ config-prettier/        # Shared Prettier configuration
â”‚
â”œâ”€â”€ .github/workflows/          # CI/CD pipelines
â”œâ”€â”€ .husky/                     # Git hooks (pre-commit, pre-push)
â”œâ”€â”€ turbo.json                  # Turborepo task pipeline
â”œâ”€â”€ package.json                # Root workspace configuration
â”œâ”€â”€ tsconfig.base.json          # Base TypeScript configuration
â”œâ”€â”€ bunfig.toml                 # Bun runtime configuration
â””â”€â”€ .env.example                # Root environment variable template
\`\`\`

---

## Architectural Philosophy

### 1. Feature-Based Organization
Code is organized by **business domain**, not by technical layer. Each feature is a self-contained module with its own controller, service, repository, DTOs, and types.

### 2. Separation of Concerns
- **Controllers** handle HTTP concerns only (routing, request/response)
- **Services** contain business logic and orchestration
- **Repositories** encapsulate database access
- **DTOs** define the shape of incoming/outgoing data

### 3. Shared Code Extraction
When code is used across multiple apps, it must be extracted into a \`packages/\` workspace. Never duplicate logic between \`apps/\`.

### 4. Type Safety
- All code uses TypeScript in strict mode
- Request/response validation uses Zod schemas
- Internal interfaces are explicitly typed

### 5. Fail-Fast Configuration
Environment variables are validated at startup using Zod schemas. Missing or malformed configuration crashes the app immediately with a clear error message â€” not at runtime when a request happens to need that variable.

---

## API Architecture (NestJS)

\`\`\`
apps/api/src/
â”œâ”€â”€ main.ts                     # Bootstrap & global pipes/filters
â”œâ”€â”€ app.module.ts               # Root module
â”‚
â”œâ”€â”€ config/
â”‚   â”œâ”€â”€ env.schema.ts           # Zod schema for environment variables
â”‚   â”œâ”€â”€ env.config.ts           # Validated env configuration service
â”‚   â””â”€â”€ app.config.ts           # NestJS ConfigModule setup
â”‚
â”œâ”€â”€ common/
â”‚   â”œâ”€â”€ decorators/             # Custom decorators
â”‚   â”œâ”€â”€ filters/                # Exception filters
â”‚   â”œâ”€â”€ guards/                 # Auth guards, role guards
â”‚   â”œâ”€â”€ interceptors/           # Response transform, logging
â”‚   â”œâ”€â”€ middleware/              # Request logging, CORS
â”‚   â””â”€â”€ pipes/                  # Zod validation pipe
â”‚
â”œâ”€â”€ database/
â”‚   â”œâ”€â”€ database.module.ts      # Database connection module
â”‚   â””â”€â”€ database.providers.ts   # Database providers
â”‚
â””â”€â”€ features/
    â”œâ”€â”€ health/                 # Health check endpoint
    â””â”€â”€ users/                  # Example feature module
        â”œâ”€â”€ users.controller.ts
        â”œâ”€â”€ users.service.ts
        â”œâ”€â”€ users.repository.ts
        â”œâ”€â”€ users.module.ts
        â”œâ”€â”€ users.schema.ts     # Zod validation schemas
        â”œâ”€â”€ users.types.ts      # TypeScript interfaces
        â””â”€â”€ dto/
            â”œâ”€â”€ create-user.dto.ts
            â””â”€â”€ update-user.dto.ts
\`\`\`

---

## Layer Responsibilities

### Controllers
- Accept HTTP requests and return responses
- Delegate ALL business logic to services
- Apply validation pipes to incoming data
- Apply guards for authorization
- **Should NOT** contain business logic, database queries, or complex transformations

### Services
- Contain all business logic
- Orchestrate calls to repositories and external services
- Handle transactions when needed
- Throw domain-specific exceptions
- **Should NOT** access \`Request\` or \`Response\` objects directly

### Repositories
- Encapsulate all database access
- Map between database entities and domain objects
- Handle query construction
- **Should NOT** contain business logic

### DTOs (Data Transfer Objects)
- Define the shape of request/response data
- Use Zod schemas for runtime validation
- Export both the Zod schema and the inferred TypeScript type
- Located in the \`dto/\` subdirectory of each feature

### Schemas
- Zod schemas for entity validation
- Used by both DTOs and services
- Located at the feature root (e.g., \`users.schema.ts\`)

### Types
- Pure TypeScript interfaces/types for the feature
- No runtime code â€” only type declarations
- Located at the feature root (e.g., \`users.types.ts\`)

---

## Shared Packages

| Package | Scope | Purpose |
|---------|-------|---------|\
| \`ui\` | \`${packageScope}/ui\` | Shared React components used by web and mobile |
| \`types\` | \`${packageScope}/types\` | Shared TypeScript types and Zod schemas |
| \`utils\` | \`${packageScope}/utils\` | General-purpose utility functions |
| \`email\` | \`${packageScope}/email\` | Email templates and sending logic |
| \`config-typescript\` | \`${packageScope}/config-typescript\` | Base and app-specific tsconfig presets |
| \`config-eslint\` | \`${packageScope}/config-eslint\` | ESLint rule presets |
| \`config-prettier\` | \`${packageScope}/config-prettier\` | Prettier formatting presets |

### When to Create a New Package

Create a new package when:
- Code is shared across **2+ apps**
- The code represents a **distinct, cohesive domain** (e.g., analytics, payments)
- The code has its **own dependencies** that shouldn't pollute other packages

---

## Environment Configuration

Each application manages its own environment independently:

| App | Example File | Runtime Loader |
|-----|-------------|---------------|
| \`apps/api\` | \`apps/api/.env.example\` | dotenvx / NestJS ConfigModule |
${webEnvRow}${workerEnvRow}
### dotenvx Encryption Workflow

\`\`\`bash
# 1. Copy the example and fill in values
cp apps/api/.env.example apps/api/.env

# 2. Encrypt for team sharing (creates .env.vault)
bun run env:encrypt

# 3. Commit .env.vault â€” share DOTENV_KEY via 1Password / GitHub Secrets
# 4. CI decrypts automatically using DOTENV_KEY environment variable
\`\`\`

### Convention

\`\`\`typescript
// âŒ Bad â€” scattered, untyped, fails at runtime
const secret = process.env.JWT_SECRET;

// âœ… Good â€” centralized, typed, validated at boot
constructor(private readonly envConfig: EnvConfigService) {}
const secret = this.envConfig.get('JWT_SECRET');
\`\`\`

---

## Pre-Push Quality Gate

This project uses [Husky](https://typicode.github.io/husky/) and
[lint-staged](https://github.com/okonet/lint-staged) to enforce quality before code leaves your machine.

| Hook | When | What runs |
|------|------|----------|
| \`pre-commit\` | Every \`git commit\` | lint-staged (lint + format staged files only) |
| \`pre-push\` | Every \`git push\` | Full \`type-check\` + \`lint\`${testHookNote} across monorepo |

### lint-staged targets
- \`*.{ts,tsx}\` â†’ ESLint fix + Prettier write
- \`*.{json,md,yml}\` â†’ Prettier write

To skip hooks in an emergency (use sparingly):

\`\`\`bash
git push --no-verify
\`\`\`

---

## CI/CD Pipeline

### ci.yml â€” Continuous Integration

Runs on every push to \`main\`/\`develop\` and on all pull requests.

\`\`\`
PR opened
  â””â”€â”€ ci.yml triggers
        â”œâ”€â”€ Node 18.x: type-check â†’ lint â†’ build${testSuffix}
        â”œâ”€â”€ Node 20.x: type-check â†’ lint â†’ build${testSuffix}
        â””â”€â”€ Node 22.x: type-check â†’ lint â†’ build${testSuffix}
\`\`\`

All three matrix jobs must pass before a PR can merge.

### release.yml â€” Release Gate

Triggered when a semver tag is pushed (\`v*.*.*\`):

\`\`\`bash
git tag v1.2.0
git push --tags
\`\`\`
${dockerReleaseBlock}
---
${dockerArchSection}
## Adding a New Feature

### Step 1: Create the Feature Directory

\`\`\`
apps/api/src/features/orders/
â”œâ”€â”€ orders.controller.ts
â”œâ”€â”€ orders.service.ts
â”œâ”€â”€ orders.repository.ts
â”œâ”€â”€ orders.module.ts
â”œâ”€â”€ orders.schema.ts
â”œâ”€â”€ orders.types.ts
â””â”€â”€ dto/
    â”œâ”€â”€ create-order.dto.ts
    â””â”€â”€ update-order.dto.ts
\`\`\`

### Step 2: Define Types (\`orders.types.ts\`)
Define the TypeScript interfaces for the feature's domain entities.

### Step 3: Define Schemas (\`orders.schema.ts\`)
Create Zod schemas for validation â€” these will be used by DTOs and services.

### Step 4: Create DTOs (\`dto/\`)
Define request/response shapes using Zod schemas:
\`\`\`typescript
import { z } from 'zod';
import { createOrderSchema } from '../orders.schema';

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
\`\`\`

### Step 5: Implement Repository (\`orders.repository.ts\`)
Encapsulate all database operations for this feature.

### Step 6: Implement Service (\`orders.service.ts\`)
Write business logic, inject the repository, throw domain exceptions.

### Step 7: Implement Controller (\`orders.controller.ts\`)
Wire up routes, apply validation pipes, delegate to the service.

### Step 8: Create Module (\`orders.module.ts\`)
Register the controller, service, and repository. Import required modules.

### Step 9: Register in AppModule
Import \`OrdersModule\` in \`app.module.ts\`.

---

## Code Conventions

### Naming
- **Files**: \`kebab-case\` (e.g., \`create-user.dto.ts\`)
- **Classes**: \`PascalCase\` (e.g., \`UsersService\`)
- **Interfaces**: \`PascalCase\` with no \`I\` prefix (e.g., \`User\`, not \`IUser\`)
- **Variables/Functions**: \`camelCase\`

### Imports
- Use \`workspace:*\` protocol for internal package dependencies
- Use path aliases where configured
- Group imports: external â†’ internal packages â†’ relative

### File Organization
- One class per file (services, controllers, etc.)
- Co-locate related files in feature directories
- Extract shared utilities to \`packages/utils\`
- Extract shared types to \`packages/types\`

### Testing (if enabled)
- Tests live alongside source files in \`__tests__/\` directories
- Name test files \`*.spec.ts\`
- Use the Testing Module for unit tests
- Mock repositories in service tests
`;
  }
}
