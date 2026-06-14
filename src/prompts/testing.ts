import { select } from '@inquirer/prompts';
import type { TestingOption } from '../types/config.js';

/**
 * Prompt the user for their testing framework preference.
 */
export async function promptTesting(): Promise<TestingOption> {
  return select<TestingOption>({
    message: 'Would you like to include testing?',
    choices: [
      {
        name: 'None — I will set up testing later',
        value: 'none',
      },
      {
        name: 'Jest — Unit and integration testing',
        value: 'jest',
      },
    ],
    default: 'none',
  });
}
