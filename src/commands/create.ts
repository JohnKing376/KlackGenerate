import { runPrompts } from '../prompts/index.js';
import { RootGenerator } from '../generators/root/root.generator.js';
import { ApiGenerator } from '../generators/api/api.generator.js';
import { WebGenerator } from '../generators/web/web.generator.js';
import { MobileGenerator } from '../generators/mobile/mobile.generator.js';
import { WorkerGenerator } from '../generators/worker/worker.generator.js';
import { PackagesGenerator } from '../generators/packages/packages.generator.js';
import { initGitRepo } from '../utils/git.js';
import { ensureDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { withSpinner } from '../utils/spinner.js';
import { validateProjectName } from '../utils/validate.js';
import type { ProjectConfig } from '../types/config.js';
import chalk from 'chalk';

interface CreateOptions {
  git?: boolean;
  install?: boolean;
}

/**
 * Main create command handler.
 * Orchestrates the entire project scaffolding process.
 */
export async function createCommand(
  projectName: string | undefined,
  options: CreateOptions,
): Promise<void> {
  try {
    // Banner
    console.log();
    console.log(
      chalk.hex('#7C3AED').bold('  ╔══════════════════════════════════════╗'),
    );
    console.log(
      chalk.hex('#7C3AED').bold('  ║') +
        chalk.white.bold('    klack-generate-monorepo v1.0.0    ') +
        chalk.hex('#7C3AED').bold('║'),
    );
    console.log(
      chalk.hex('#7C3AED').bold('  ╚══════════════════════════════════════╝'),
    );
    console.log();
    console.log(
      chalk.dim('  Scaffold a production-grade TypeScript monorepo'),
    );
    console.log();

    // Validate project name if provided via CLI arg
    if (projectName) {
      const error = validateProjectName(projectName);
      if (error) {
        logger.error(error);
        process.exit(1);
      }
    }

    // Run interactive prompts
    const config = await runPrompts(projectName);

    // Summary
    console.log();
    logger.banner('Project Configuration');
    logger.keyValue('Project', config.projectName);
    logger.keyValue('Scope', config.packageScope);
    logger.keyValue('API', 'NestJS');
    logger.keyValue('Web', config.includeWeb ? 'Next.js (App Router)' : 'Skipped');
    logger.keyValue('Mobile', config.includeMobile ? 'Expo + React Native' : 'Skipped');
    logger.keyValue('Worker', config.includeWorker ? 'Included (dormant)' : 'Skipped');
    logger.keyValue('Testing', config.testing === 'none' ? 'None' : 'Jest');
    logger.keyValue('Database', config.database === 'none' ? 'None' : config.database);
    logger.keyValue('Auth', config.auth === 'none' ? 'None' : config.auth);
    console.log();

    // Count generators for progress tracking
    const totalSteps = countSteps(config, options);
    let currentStep = 0;

    // ─── Step 1: Create directory ──────────────────────────────────
    currentStep++;
    logger.step(currentStep, totalSteps, 'Creating project directory');
    await ensureDir(config.targetDir);

    // ─── Step 2: Root configuration ────────────────────────────────
    currentStep++;
    await withSpinner(
      `[${currentStep}/${totalSteps}] Generating root configuration`,
      async () => {
        const generator = new RootGenerator(config);
        await generator.run();
      },
    );

    // ─── Step 3: Shared packages ───────────────────────────────────
    currentStep++;
    await withSpinner(
      `[${currentStep}/${totalSteps}] Generating shared packages`,
      async () => {
        const generator = new PackagesGenerator(config);
        await generator.run();
      },
    );

    // ─── Step 4: API (always included) ─────────────────────────────
    currentStep++;
    await withSpinner(
      `[${currentStep}/${totalSteps}] Generating API (NestJS)`,
      async () => {
        const generator = new ApiGenerator(config);
        await generator.run();
      },
    );

    // ─── Step 5: Web (optional) ────────────────────────────────────
    if (config.includeWeb) {
      currentStep++;
      await withSpinner(
        `[${currentStep}/${totalSteps}] Generating web app (Next.js)`,
        async () => {
          const generator = new WebGenerator(config);
          await generator.run();
        },
      );
    }

    // ─── Step 6: Mobile (optional) ─────────────────────────────────
    if (config.includeMobile) {
      currentStep++;
      await withSpinner(
        `[${currentStep}/${totalSteps}] Generating mobile app (Expo)`,
        async () => {
          const generator = new MobileGenerator(config);
          await generator.run();
        },
      );
    }

    // ─── Step 7: Worker (optional) ─────────────────────────────────
    if (config.includeWorker) {
      currentStep++;
      await withSpinner(
        `[${currentStep}/${totalSteps}] Generating worker app`,
        async () => {
          const generator = new WorkerGenerator(config);
          await generator.run();
        },
      );
    }

    // ─── Step 8: Git init ──────────────────────────────────────────
    if (options.git !== false) {
      currentStep++;
      await withSpinner(
        `[${currentStep}/${totalSteps}] Initializing git repository`,
        async () => {
          await initGitRepo(config.targetDir);
        },
      );
    }

    // ─── Success ───────────────────────────────────────────────────
    printSuccessMessage(config);
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      console.log();
      logger.dim('Cancelled.');
      process.exit(0);
    }

    logger.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    process.exit(1);
  }
}

function countSteps(config: ProjectConfig, options: CreateOptions): number {
  let steps = 4; // dir + root + packages + api (always)
  if (config.includeWeb) steps++;
  if (config.includeMobile) steps++;
  if (config.includeWorker) steps++;
  if (options.git !== false) steps++;
  return steps;
}

function printSuccessMessage(config: ProjectConfig): void {
  console.log();
  console.log(
    chalk.green.bold('  ✔ Project created successfully!'),
  );
  console.log();
  console.log(chalk.white.bold('  Next steps:'));
  console.log();
  console.log(chalk.dim('  1.') + ` cd ${config.projectName}`);
  console.log(chalk.dim('  2.') + ' bun install');
  console.log(chalk.dim('  3.') + ' cp .env.example .env');
  console.log(chalk.dim('  4.') + ' bun run dev');
  console.log();
  console.log(
    chalk.dim('  Read ') +
      chalk.white('ARCHITECTURE.md') +
      chalk.dim(' for architectural guidelines.'),
  );
  console.log();
}
