import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { generateCommand } from './commands/generate.js';

const program = new Command();

program
  .name('klack-generate-monorepo')
  .description(
    'Scaffold a production-grade full-stack TypeScript monorepo with Bun, Turborepo, NestJS, Next.js, and Expo',
  )
  .version('1.0.0');

// Default command: create a new project
program
  .argument('[project-name]', 'Name of the project to create')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .action(createCommand);

// Generate subcommand
const generate = program
  .command('generate')
  .alias('g')
  .description('Generate resources within an existing project');

generate
  .command('resource <name>')
  .alias('r')
  .description('Generate a new feature resource (controller, service, repository, module, etc.)')
  .action(generateCommand);

program.parse();
