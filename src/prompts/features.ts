import { checkbox } from '@inquirer/prompts';

export interface FeatureSelection {
  includeWeb: boolean;
  includeMobile: boolean;
  includeWorker: boolean;
}

/**
 * Prompt the user to select which applications to include.
 * The API (NestJS) is always included and not presented as an option.
 */
export async function promptFeatures(): Promise<FeatureSelection> {
  const selected = await checkbox({
    message: 'Which applications would you like to include? (API is always included)',
    choices: [
      {
        name: 'Web App (Next.js with App Router)',
        value: 'web',
        checked: false,
      },
      {
        name: 'Mobile App (Expo + React Native)',
        value: 'mobile',
        checked: false,
      },
      {
        name: 'Worker (Background job processing)',
        value: 'worker',
        checked: false,
      },
    ],
  });

  return {
    includeWeb: selected.includes('web'),
    includeMobile: selected.includes('mobile'),
    includeWorker: selected.includes('worker'),
  };
}
