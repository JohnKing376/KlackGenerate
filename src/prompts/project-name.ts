import { input } from '@inquirer/prompts';
import { validateProjectName } from '../utils/validate.js';
import { directoryExists } from '../utils/fs.js';
import { join } from 'node:path';
import chalk from 'chalk';

/**
 * Prompt the user for a valid project name.
 */
export async function promptProjectName(): Promise<string> {
  const name = await input({
    message: 'What is your project name?',
    default: 'my-app',
    validate: async (value: string) => {
      const error = validateProjectName(value);
      if (error) return error;

      const targetDir = join(process.cwd(), value);
      if (await directoryExists(targetDir)) {
        return `Directory ${chalk.bold(value)} already exists. Choose a different name.`;
      }

      return true;
    },
  });

  return name.trim();
}
