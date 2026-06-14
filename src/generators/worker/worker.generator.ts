import { Generator } from '../base/generator.js';
import { writeFiles } from '../../utils/fs.js';
import { join } from 'node:path';

/**
 * Worker app generator.
 * Produces a dormant background job processing structure.
 *
 * Key design decisions:
 * - Does NOT automatically start background jobs
 * - Does NOT require Redis to run
 * - Contains the structure for future job processing (BullMQ, etc.)
 * - Clearly documented activation instructions
 */
export class WorkerGenerator extends Generator {
  readonly name = 'worker';

  private get workerDir(): string {
    return join(this.config.targetDir, 'apps', 'worker');
  }

  protected async writeFiles(): Promise<void> {
    const files: Record<string, string> = {
      'package.json': this.packageJson(),
      'tsconfig.json': this.tsconfig(),
      'src/main.ts': this.mainTs(),
      'src/jobs/example.job.ts': this.exampleJob(),
      'src/queues/index.ts': this.queueIndex(),
      'src/config/worker.config.ts': this.workerConfig(),
    };

    files['.env.example'] = this.workerEnvExample();

    if (this.config.includeDocker) {
      files['Dockerfile'] = this.workerDockerfile();
    }

    await writeFiles(this.workerDir, files);
  }

  private packageJson(): string {
    const scope = this.config.packageScope;

    const pkg = {
      name: `${scope}/worker`,
      version: '0.1.0',
      private: true,
      scripts: {
        'dev': 'tsx watch src/main.ts',
        'build': 'tsc',
        'start': 'node dist/main.js',
        'lint': 'eslint "src/**/*.ts"',
        'type-check': 'tsc --noEmit',
      },
      dependencies: {
        [`${scope}/types`]: 'workspace:*',
        [`${scope}/utils`]: 'workspace:*',
        // Uncomment when ready to use BullMQ:
        // 'bullmq': '^5.0.0',
      },
      devDependencies: {
        '@types/node': '^22.0.0',
        'tsx': '^4.0.0',
        'typescript': '^5.6.0',
        [`${scope}/config-typescript`]: 'workspace:*',
      },
    };

    return JSON.stringify(pkg, null, 2) + '\n';
  }

  private tsconfig(): string {
    const tsconfig = {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };

    return JSON.stringify(tsconfig, null, 2) + '\n';
  }

  private mainTs(): string {
    return `/**
 * Worker Application Entry Point
 *
 * This worker is currently DORMANT. It does not start any background
 * jobs or require any external services (like Redis) to run.
 *
 * To activate background job processing:
 *
 * 1. Install BullMQ:
 *    bun add bullmq
 *
 * 2. Ensure Redis is running:
 *    docker run -d -p 6379:6379 redis
 *
 * 3. Uncomment the bootstrap code below
 *
 * 4. Configure your connection in src/config/worker.config.ts
 */

import { workerConfig } from './config/worker.config';

async function bootstrap() {
  console.log('Worker starting...');
  console.log(\`Environment: \${workerConfig.nodeEnv}\`);

  if (!workerConfig.enabled) {
    console.log('⏸  Worker is disabled. Set WORKER_ENABLED=true to activate.');
    console.log('   See src/config/worker.config.ts for configuration.');
    return;
  }

  // ─── Uncomment below to start processing jobs ───
  //
  // import { registerQueues } from './queues';
  //
  // const queues = registerQueues({
  //   connection: {
  //     host: workerConfig.redisHost,
  //     port: workerConfig.redisPort,
  //   },
  // });
  //
  // console.log(\`✅ Worker processing \${queues.length} queue(s)\`);
  //
  // // Graceful shutdown
  // const shutdown = async () => {
  //   console.log('Shutting down worker...');
  //   for (const queue of queues) {
  //     await queue.close();
  //   }
  //   process.exit(0);
  // };
  //
  // process.on('SIGINT', shutdown);
  // process.on('SIGTERM', shutdown);

  console.log('Worker bootstrap complete (dormant mode).');
}

bootstrap().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
`;
  }

  private exampleJob(): string {
    return `/**
 * Example Job Definition
 *
 * This file demonstrates the pattern for defining background jobs.
 * It does NOT run automatically — it's a template for your own jobs.
 *
 * To use this pattern with BullMQ:
 *
 * 1. Define your job data type
 * 2. Create a processor function
 * 3. Register the queue in src/queues/index.ts
 */

// ─── Job Types ─────────────────────────────────────────────────────────

/**
 * Data shape for the example job.
 */
export interface ExampleJobData {
  userId: string;
  action: string;
  payload: Record<string, unknown>;
}

/**
 * Result shape for the example job.
 */
export interface ExampleJobResult {
  success: boolean;
  processedAt: string;
}

// ─── Job Processor ─────────────────────────────────────────────────────

/**
 * Process an example job.
 *
 * In a real application, this would:
 * - Send emails
 * - Generate reports
 * - Process file uploads
 * - Sync data with external services
 * - etc.
 */
export async function processExampleJob(data: ExampleJobData): Promise<ExampleJobResult> {
  console.log(\`Processing example job for user \${data.userId}: \${data.action}\`);

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    success: true,
    processedAt: new Date().toISOString(),
  };
}

// ─── BullMQ Integration (uncomment when ready) ─────────────────────────
//
// import { Worker } from 'bullmq';
//
// export function createExampleWorker(connection: { host: string; port: number }) {
//   return new Worker<ExampleJobData, ExampleJobResult>(
//     'example-queue',
//     async (job) => {
//       return processExampleJob(job.data);
//     },
//     {
//       connection,
//       concurrency: 5,
//     },
//   );
// }
`;
  }

  private queueIndex(): string {
    return `/**
 * Queue Registry
 *
 * Register all background job queues here.
 * This file serves as the central registry for all worker queues.
 *
 * When activating the worker:
 * 1. Import your job worker creators
 * 2. Register them in the registerQueues function
 * 3. The main.ts will call this function to start processing
 */

// import { createExampleWorker } from '../jobs/example.job';

export interface QueueConnection {
  host: string;
  port: number;
}

/**
 * Register and start all queue workers.
 * Returns an array of workers for lifecycle management.
 */
export function registerQueues(_config: { connection: QueueConnection }) {
  const workers: Array<{ close: () => Promise<void> }> = [];

  // Uncomment to register queues:
  // workers.push(createExampleWorker(config.connection));

  return workers;
}
`;
  }

  private workerConfig(): string {
    return `/**
 * Worker configuration.
 * Uses environment variables with sensible defaults.
 *
 * The worker is DISABLED by default. Set WORKER_ENABLED=true to activate.
 */
export const workerConfig = {
  /** Whether the worker should process jobs */
  enabled: process.env['WORKER_ENABLED'] === 'true',

  /** Current environment */
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  /** Redis connection host */
  redisHost: process.env['REDIS_HOST'] ?? 'localhost',

  /** Redis connection port */
  redisPort: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),

  /** Maximum number of concurrent jobs */
  concurrency: parseInt(process.env['WORKER_CONCURRENCY'] ?? '5', 10),
} as const;
`;
  }

  private workerEnvExample(): string {
    return `# Worker Environment Variables
# Copy to .env and fill in your values.
# Set WORKER_ENABLED=true to activate job processing.

# ---- Worker ----
NODE_ENV=development
WORKER_ENABLED=false
WORKER_CONCURRENCY=5

# ---- Redis ----
# Required when WORKER_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
`;
  }

  private workerDockerfile(): string {
    return `# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lockb* ./
COPY packages/ ./packages/
COPY apps/worker/package.json ./apps/worker/

RUN bun install --frozen-lockfile

COPY apps/worker/ ./apps/worker/
COPY tsconfig.base.json ./
RUN cd apps/worker && bun run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/package.json ./

CMD ["node", "dist/main.js"]

# ─── Stage 3: Development ─────────────────────────────────────────────────────
FROM builder AS development
ENV NODE_ENV=development
WORKDIR /app/apps/worker
CMD ["bun", "run", "dev"]
`;
  }
}
