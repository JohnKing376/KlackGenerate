import type { ProjectConfig, ApiFrameworkOption } from '../../types/config.js';
import { Generator } from '../base/generator.js';
import { NestGenerator } from './nest/nest.generator.js';

/**
 * Registry mapping framework IDs to their generator classes.
 * New frameworks are added here.
 */
const FRAMEWORK_GENERATORS: Partial<Record<ApiFrameworkOption, new (config: ProjectConfig) => Generator>> = {
  nestjs: NestGenerator,
  // Future:
  // hono: HonoGenerator,
  // adonis: AdonisGenerator,
};

/**
 * API generator dispatcher.
 * Selects and runs the appropriate framework generator based on config.
 */
export class ApiGenerator extends Generator {
  readonly name = 'api';

  protected async writeFiles(): Promise<void> {
    const GeneratorClass = FRAMEWORK_GENERATORS[this.config.apiFramework];

    if (!GeneratorClass) {
      throw new Error(
        `No generator found for API framework: "${this.config.apiFramework}". ` +
          `Available frameworks: ${Object.keys(FRAMEWORK_GENERATORS).join(', ')}`,
      );
    }

    const generator = new GeneratorClass(this.config);
    await generator.run();
  }
}
