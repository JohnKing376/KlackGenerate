import { promptProjectName } from './project-name.js';
import { promptFeatures } from './features.js';
import { promptTesting } from './testing.js';
import { promptDatabase } from './database.js';
import { promptAuth } from './auth.js';
import { promptDocker } from './docker.js';
import { toPackageScope } from '../utils/validate.js';
import { join } from 'node:path';
import type { ProjectConfig } from '../types/config.js';

/**
 * Run all interactive prompts in sequence and return a complete ProjectConfig.
 *
 * @param initialName - Optional project name from CLI argument (skips the name prompt)
 */
export async function runPrompts(initialName?: string): Promise<ProjectConfig> {
  const projectName = initialName ?? (await promptProjectName());
  const packageScope = toPackageScope(projectName);

  const features = await promptFeatures();
  const testing = await promptTesting();
  const database = await promptDatabase();
  const auth = await promptAuth();
  const includeDocker = await promptDocker();

  const targetDir = join(process.cwd(), projectName);

  return {
    projectName,
    packageScope,
    includeWeb: features.includeWeb,
    includeMobile: features.includeMobile,
    includeWorker: features.includeWorker,
    includeDocker,
    testing,
    database,
    auth,
    apiFramework: 'nestjs',
    targetDir,
  };
}
