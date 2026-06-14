# KlackGenerate (Monorepo)

A production-grade, interactive CLI tool to scaffold an enterprise-ready full-stack TypeScript monorepo powered by **Bun workspaces**, **Turborepo**, **NestJS**, **Next.js**, and **Expo (React Native)**.

---

## Features

- **High-Performance Runtime**: Engineered for [Bun](https://bun.sh) workspaces.
- **Monorepo Build System**: Monitored and cached builds using [Turborepo](https://turbo.build).
- **Production-Ready API**: Fully typed [NestJS](https://nestjs.com) application featuring:
  - Automatic **Zod validation** integrated at the global DTO level.
  - Dynamic **Swagger documentation** matching request/response schemas.
  - Option for JWT Authentication with guards and Swagger Bearer Auth decorators.
- **Next.js Web App** (Optional): Modern Next.js application using the App Router, pre-loaded with global styles, providers, and modular architecture.
- **Expo Mobile App** (Optional): Cross-platform mobile app setup using Expo and React Native.
- **Background Worker** (Optional): Dedicated background job processing container/app.
- **Database Presets**: Seamless integration with **Prisma** or **Drizzle** supporting PostgreSQL, SQLite, or no database options.
- **Docker Compose**: Pre-configured multi-container setups for running Postgres, Redis, the API, and worker processes locally in one command.

---

## Installation & Usage

You can use the generator directly without installing it globally using `npx`:

```bash
npx klack-generate-monorepo <project-name>
# OR using the short alias:
npx klack-generate <project-name>
```

Alternatively, you can install the CLI globally:

```bash
npm install -g klack-generate-monorepo

# Run the generator
klack-generate my-new-monorepo
```

### Interactive Scaffolding Options

When you run `klack-generate`, you will be guided through a series of interactive prompts to customize your monorepo setup:

1. **Applications to Include**:
   - `API` (Always included, NestJS base)
   - `Web App` (Next.js with App Router)
   - `Mobile App` (Expo + React Native)
   - `Worker` (Background job processor)
2. **Database Engine**:
   - PostgreSQL (Prisma or Drizzle)
   - SQLite (Prisma or Drizzle)
   - None
3. **Authentication Strategy**:
   - JWT Auth (with guards, Swagger integration, and user controllers)
   - None

---

## Monorepo Resource Generator

Once your monorepo project is scaffolded, you can use the command-line helper from the root of your newly created project to generate vertical features and resources (such as endpoints, services, repositories, and models):

```bash
# Generate a complete feature module inside the API app
bun run generate resource users
```

---

## Local Development of the CLI Tool

If you want to modify or run the generator code locally:

### 1. Install Dependencies
Make sure you have [Bun](https://bun.sh) installed.
```bash
bun install
```

### 2. Development (Watch Mode)
Compile TypeScript source files into `dist/` continuously:
```bash
npm run dev
```

### 3. Build & Typecheck
Compile the project once and run TypeScript checks:
```bash
npm run build
npm run type-check
```

### 4. Test Scaffolding Locally
To test the CLI locally without publishing:
```bash
node dist/cli.js my-test-monorepo
```

---

## Publishing to NPM

This package is ready to be published to the npm registry.

### 1. Login to NPM
Ensure you have logged in to your npm account:
```bash
npm login
```

### 2. Compile and Publish
Run the publish command. The configured `prepublishOnly` lifecycle hook will automatically trigger `clean`, `build`, and `type-check` to guarantee a clean build upload:
```bash
npm publish
```

To publish scoped packages or specify access:
```bash
npm publish --access public
```

---

## License

MIT License. Feel free to use and customize for your own projects!
