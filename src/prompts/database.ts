import { select } from '@inquirer/prompts';
import type { DatabaseOption } from '../types/config.js';

/**
 * Prompt the user for their database ORM preference.
 * Currently only "None" is fully implemented; Prisma/Drizzle are future options.
 */
export async function promptDatabase(): Promise<DatabaseOption> {
  return select<DatabaseOption>({
    message: 'Which database ORM would you like to use?',
    choices: [
      {
        name: 'None — I will configure a database later',
        value: 'none',
      },
      {
        name: 'Prisma — Type-safe ORM with migrations',
        value: 'prisma',
      },
      // Future:
      // {
      //   name: 'Drizzle — Lightweight, SQL-first ORM',
      //   value: 'drizzle',
      // },
    ],
    default: 'none',
  });
}
