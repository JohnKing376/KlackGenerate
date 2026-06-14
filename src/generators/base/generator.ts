import type { ProjectConfig } from '../../types/config.js';

/**
 * Abstract base class for all generators.
 *
 * Implements the Template Method pattern:
 * - `prepare()` → optional setup logic
 * - `writeFiles()` → main file generation (must implement)
 * - `postProcess()` → optional cleanup or post-generation steps
 *
 * Subclasses override `writeFiles()` at minimum.
 */
export abstract class Generator {
  /** The name of this generator (used in logging) */
  abstract readonly name: string;

  constructor(protected readonly config: ProjectConfig) {}

  /**
   * Execute the full generation lifecycle.
   */
  async run(): Promise<void> {
    await this.prepare();
    await this.writeFiles();
    await this.postProcess();
  }

  /**
   * Optional setup logic. Override to perform any preparation
   * before file generation (e.g., computing derived values).
   */
  protected async prepare(): Promise<void> {
    // Default: no-op
  }

  /**
   * Main file generation logic. Subclasses MUST implement this.
   */
  protected abstract writeFiles(): Promise<void>;

  /**
   * Optional post-processing. Override to perform cleanup,
   * install dependencies, or log next steps.
   */
  protected async postProcess(): Promise<void> {
    // Default: no-op
  }

  /**
   * Helper: resolve a path relative to the target project directory.
   */
  protected targetPath(...segments: string[]): string {
    const { join } = require('node:path') as typeof import('node:path');
    return join(this.config.targetDir, ...segments);
  }
}
