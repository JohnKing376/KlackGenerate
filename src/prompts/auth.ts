import { select } from '@inquirer/prompts';
import type { AuthOption } from '../types/config.js';

/**
 * Prompt the user for their authentication strategy preference.
 * Currently only "None" is fully implemented; JWT is a future option.
 */
export async function promptAuth(): Promise<AuthOption> {
  return select<AuthOption>({
    message: 'Which authentication strategy would you like to use?',
    choices: [
      {
        name: 'None — I will configure authentication later',
        value: 'none',
      },
      {
        name: 'JWT — JSON Web Token with Passport',
        value: 'jwt',
      },
    ],
    default: 'none',
  });
}
