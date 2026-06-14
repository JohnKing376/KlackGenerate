import { Generator } from '../../base/generator.js';
import { writeFiles } from '../../../utils/fs.js';
import { join } from 'node:path';

/**
 * NestJS API generator.
 * Produces a complete feature-based NestJS application with:
 * - Zod-based environment validation (fail-fast)
 * - Feature-based folder structure
 * - Repository pattern
 * - Zod validation pipe
 * - Response transform interceptor
 * - Health check endpoint
 * - Example users feature (full CRUD scaffold)
 */
export class NestGenerator extends Generator {
  readonly name = 'nestjs-api';

  private get apiDir(): string {
    return join(this.config.targetDir, 'apps', 'api');
  }

  protected async writeFiles(): Promise<void> {
    const files: Record<string, string> = {
      // Root config
      'package.json': this.packageJson(),
      'tsconfig.json': this.tsconfig(),
      'nest-cli.json': this.nestCliJson(),

      // Entry point
      'src/main.ts': this.mainTs(),
      'src/app.module.ts': this.appModule(),

      // Config (env validation)
      'src/config/env.schema.ts': this.envSchema(),
      'src/config/env.config.ts': this.envConfig(),
      'src/config/app.config.ts': this.appConfig(),

      // Common
      'src/common/filters/http-exception.filter.ts': this.httpExceptionFilter(),
      'src/common/interceptors/transform.interceptor.ts': this.transformInterceptor(),
      'src/common/pipes/zod-validation.pipe.ts': this.zodValidationPipe(),
      'src/common/middleware/request-logger.middleware.ts': this.requestLoggerMiddleware(),
      'src/common/decorators/api-response.decorator.ts': this.apiResponseDecorator(),
      'src/common/guards/.gitkeep': '',

      // Database
      'src/database/database.module.ts': this.databaseModule(),
      'src/database/database.providers.ts': this.databaseProviders(),

      // Features: Health
      'src/features/health/health.controller.ts': this.healthController(),
      'src/features/health/health.service.ts': this.healthService(),
      'src/features/health/health.module.ts': this.healthModule(),

      // Features: Users (full example)
      'src/features/users/users.controller.ts': this.usersController(),
      'src/features/users/users.service.ts': this.usersService(),
      'src/features/users/users.repository.ts': this.usersRepository(),
      'src/features/users/users.module.ts': this.usersModule(),
      'src/features/users/users.schema.ts': this.usersSchema(),
      'src/features/users/users.types.ts': this.usersTypes(),
      'src/features/users/dto/create-user.dto.ts': this.createUserDto(),
      'src/features/users/dto/update-user.dto.ts': this.updateUserDto(),
    };

    // Add jest config if testing selected
    if (this.config.testing === 'jest') {
      files['jest.config.ts'] = this.jestConfig();
      files['src/features/users/__tests__/users.service.spec.ts'] = this.usersServiceSpec();
    }

    // Add database scaffolding if selected
    if (this.config.database === 'prisma') {
      files['prisma/schema.prisma'] = this.prismaSchema();
      files['src/database/prisma.service.ts'] = this.prismaService();
    } else if (this.config.database === 'drizzle') {
      files['drizzle.config.ts'] = this.drizzleConfig();
      files['src/database/schema.ts'] = this.drizzleSchema();
      files['src/database/db.ts'] = this.drizzleDb();
    }

    // Add auth scaffolding if selected
    if (this.config.auth === 'jwt') {
      files['src/features/auth/auth.module.ts'] = this.authModule();
      files['src/features/auth/auth.service.ts'] = this.authService();
      files['src/features/auth/auth.controller.ts'] = this.authController();
      files['src/features/auth/auth.guard.ts'] = this.authGuard();
      files['src/features/auth/auth.types.ts'] = this.authTypes();
      files['src/features/auth/dto/login.dto.ts'] = this.loginDto();
    }

    // Add per-app env example
    files['.env.example'] = this.apiEnvExample();

    // Add Dockerfile when Docker support is selected
    if (this.config.includeDocker) {
      files['Dockerfile'] = this.apiDockerfile();
    }

    await writeFiles(this.apiDir, files);
  }

  // ─── Root Config ───────────────────────────────────────────────────────

  private packageJson(): string {
    const scope = this.config.packageScope;

    const dependencies: Record<string, string> = {
      '@nestjs/common': '^10.4.0',
      '@nestjs/core': '^10.4.0',
      '@nestjs/platform-express': '^10.4.0',
      '@nestjs/config': '^3.3.0',
      '@nestjs/swagger': '^7.4.0',
      'nestjs-zod': '^3.0.0',
      'swagger-ui-express': '^5.0.1',
      'reflect-metadata': '^0.2.2',
      'rxjs': '^7.8.0',
      'zod': '^3.23.0',
      [`${scope}/types`]: 'workspace:*',
      [`${scope}/utils`]: 'workspace:*',
    };

    // Database dependencies
    if (this.config.database === 'prisma') {
      dependencies['@prisma/client'] = '^5.22.0';
    } else if (this.config.database === 'drizzle') {
      dependencies['drizzle-orm'] = '^0.38.0';
      dependencies['postgres'] = '^3.4.0';
    }

    // Auth dependencies
    if (this.config.auth === 'jwt') {
      dependencies['@nestjs/jwt'] = '^10.2.0';
      dependencies['@nestjs/passport'] = '^10.0.3';
      dependencies['passport'] = '^0.7.0';
      dependencies['passport-jwt'] = '^4.0.1';
    }

    const devDependencies: Record<string, string> = {
      '@nestjs/cli': '^10.4.0',
      '@nestjs/schematics': '^10.2.0',
      '@nestjs/testing': '^10.4.0',
      [`${scope}/config-typescript`]: 'workspace:*',
      [`${scope}/config-eslint`]: 'workspace:*',
      '@types/express': '^5.0.0',
      '@types/node': '^22.0.0',
      'typescript': '^5.6.0',
    };

    if (this.config.testing === 'jest') {
      devDependencies['jest'] = '^29.7.0';
      devDependencies['ts-jest'] = '^29.2.0';
      devDependencies['@types/jest'] = '^29.5.0';
    }

    if (this.config.database === 'prisma') {
      devDependencies['prisma'] = '^5.22.0';
    } else if (this.config.database === 'drizzle') {
      devDependencies['drizzle-kit'] = '^0.28.0';
    }

    if (this.config.auth === 'jwt') {
      devDependencies['@types/passport-jwt'] = '^4.0.1';
      devDependencies['@types/passport'] = '^1.0.17';
    }

    const scripts: Record<string, string> = {
      'dev': 'nest start --watch',
      'build': 'nest build',
      'start': 'node dist/main.js',
      'start:prod': 'node dist/main.js',
      'lint': 'eslint "src/**/*.ts"',
      'type-check': 'tsc --noEmit',
    };

    if (this.config.testing === 'jest') {
      scripts['test'] = 'jest';
      scripts['test:watch'] = 'jest --watch';
      scripts['test:cov'] = 'jest --coverage';
    }

    const pkg = {
      name: `${scope}/api`,
      version: '0.1.0',
      private: true,
      scripts,
      dependencies,
      devDependencies,
    };

    return JSON.stringify(pkg, null, 2) + '\n';
  }

  private tsconfig(): string {
    const tsconfig = {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        module: 'CommonJS',
        moduleResolution: 'Node',
        outDir: './dist',
        rootDir: './src',
        target: 'ES2022',
        declaration: false,
        declarationMap: false,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.spec.ts'],
    };

    return JSON.stringify(tsconfig, null, 2) + '\n';
  }

  private nestCliJson(): string {
    return JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/nest-cli',
        collection: '@nestjs/schematics',
        sourceRoot: 'src',
        compilerOptions: {
          deleteOutDir: true,
        },
      },
      null,
      2,
    ) + '\n';
  }

  // ─── Entry Point ──────────────────────────────────────────────────────

  private mainTs(): string {
    return `import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { patchNestjsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { EnvConfigService } from './config/env.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Patch NestJS Swagger to recognize nestjs-zod DTO schemas
  patchNestjsSwagger();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Get validated configuration
  const envConfig = app.get(EnvConfigService);
  const port = envConfig.get('PORT');

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes, filters, interceptors
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  app.enableCors({
    origin: envConfig.get('CORS_ORIGIN'),
    credentials: true,
  });

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API documentation and specs for the monorepo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  logger.log(\`🚀 API server running on http://localhost:\${port}/api\`);
  logger.log(\`📖 Swagger documentation available on http://localhost:\${port}/docs\`);
}

bootstrap();
`;
  }

  private appModule(): string {
    return `import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppConfigModule } from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './features/health/health.module';
import { UsersModule } from './features/users/users.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    // Configuration (must be first — validates env on boot)
    AppConfigModule,

    // Infrastructure
    DatabaseModule,

    // Feature modules
    HealthModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
`;
  }

  // ─── Config ────────────────────────────────────────────────────────────

  private envSchema(): string {
    return `import { z } from 'zod';

/**
 * Zod schema for environment variable validation.
 * The application will fail fast at startup if any required variable
 * is missing or has an invalid format.
 *
 * Add new environment variables here — never use process.env directly.
 */
export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Database (optional for now — required when database is configured)
  DATABASE_URL: z.string().url().optional(),

  // Authentication (optional — required when auth is configured)
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRATION: z.string().default('7d'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables against the schema.
 * Throws a descriptive error if validation fails.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => \`  - \${issue.path.join('.')}: \${issue.message}\`)
      .join('\\n');

    throw new Error(
      \`\\n❌ Environment validation failed:\\n\${errors}\\n\\nCheck your .env file against .env.example\\n\`,
    );
  }

  return result.data;
}
`;
  }

  private envConfig(): string {
    return `import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from './env.schema';

/**
 * Typed environment configuration service.
 * Wraps NestJS ConfigService to provide type-safe access to validated env vars.
 *
 * Usage:
 *   constructor(private readonly env: EnvConfigService) {}
 *   const port = this.env.get('PORT');
 */
@Injectable()
export class EnvConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  /**
   * Get a validated, typed environment variable.
   */
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.configService.get<EnvConfig[K]>(key, { infer: true }) as EnvConfig[K];
  }

  /**
   * Check if the application is running in production.
   */
  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  /**
   * Check if the application is running in development.
   */
  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  /**
   * Check if the application is running in test mode.
   */
  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
}
`;
  }

  private appConfig(): string {
    return `import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';
import { EnvConfigService } from './env.config';

/**
 * Global configuration module.
 * Validates all environment variables at startup and provides
 * EnvConfigService for type-safe access throughout the application.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env'],
    }),
  ],
  providers: [EnvConfigService],
  exports: [EnvConfigService],
})
export class AppConfigModule {}
`;
  }

  // ─── Common ────────────────────────────────────────────────────────────

  private httpExceptionFilter(): string {
    return `import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global HTTP exception filter.
 * Normalizes all error responses into a consistent envelope:
 *
 * {
 *   statusCode: number,
 *   message: string,
 *   error: string,
 *   timestamp: string,
 *   path: string,
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string) ?? message;
        error = (resp['error'] as string) ?? error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(\`Unhandled exception: \${exception.message}\`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
`;
  }

  private transformInterceptor(): string {
    return `import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response envelope shape.
 */
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

/**
 * Global response transform interceptor.
 * Wraps all successful responses in a consistent envelope:
 *
 * {
 *   data: <response>,
 *   meta: {
 *     timestamp: "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
`;
  }

  private zodValidationPipe(): string {
    return `import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validation pipe that uses Zod schemas to validate request data.
 *
 * Usage in controllers:
 *
 *   @Post()
 *   create(@Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto) {
 *     return this.usersService.create(dto);
 *   }
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(issue.message);
    }

    return formatted;
  }
}
`;
  }

  private requestLoggerMiddleware(): string {
    return `import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Logs every incoming HTTP request with method, URL, status code, and duration.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const logMessage = \`\${method} \${originalUrl} \${statusCode} - \${duration}ms\`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
`;
  }

  private apiResponseDecorator(): string {
    return `import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';

/**
 * Convenience decorator for common API response patterns.
 * Combines HttpCode with any future response documentation.
 *
 * Usage:
 *   @ApiSuccessResponse(HttpStatus.CREATED)
 *   @Post()
 *   create() { ... }
 */
export function ApiSuccessResponse(statusCode: HttpStatus = HttpStatus.OK) {
  return applyDecorators(HttpCode(statusCode));
}
`;
  }

  // ─── Database ──────────────────────────────────────────────────────────

  private databaseModule(): string {
    return `import { Module } from '@nestjs/common';
import { DATABASE_PROVIDERS } from './database.providers';

/**
 * Database module.
 *
 * Currently configured as a placeholder. To activate:
 * 1. Choose your ORM (Prisma, Drizzle, TypeORM, etc.)
 * 2. Add the connection provider to database.providers.ts
 * 3. Export the provider for use in feature modules
 *
 * Example with Prisma:
 *   import { PrismaService } from './prisma.service';
 *   providers: [PrismaService],
 *   exports: [PrismaService],
 */
@Module({
  providers: [...DATABASE_PROVIDERS],
  exports: [...DATABASE_PROVIDERS],
})
export class DatabaseModule {}
`;
  }

  private databaseProviders(): string {
    return `import type { Provider } from '@nestjs/common';

/**
 * Database providers.
 *
 * Add your database connection providers here.
 * They will be automatically registered by DatabaseModule.
 *
 * Example with Prisma:
 *   export const DATABASE_PROVIDERS: Provider[] = [PrismaService];
 */
export const DATABASE_PROVIDERS: Provider[] = [
  // Add database providers here when configuring your database
];
`;
  }

  // ─── Features: Health ──────────────────────────────────────────────────

  private healthController(): string {
    return `import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /api/health
   * Returns the current health status of the application.
   */
  @Get()
  check() {
    return this.healthService.check();
  }
}
`;
  }

  private healthService(): string {
    return `import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  /**
   * Returns health status including uptime and memory usage.
   */
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }
}
`;
  }

  private healthModule(): string {
    return `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
`;
  }

  // ─── Features: Users ──────────────────────────────────────────────────

  private usersSchema(): string {
    return `import { z } from 'zod';

/**
 * Base user schema — defines the shape of a User entity.
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new user.
 */
export const createUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(1, { message: 'Name is required' }).max(255),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

/**
 * Schema for updating an existing user.
 * All fields are optional.
 */
export const updateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  name: z.string().min(1).max(255).optional(),
});

/**
 * Schema for user query parameters.
 */
export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
`;
  }

  private usersTypes(): string {
    return `import { createZodDto } from 'nestjs-zod';
import type { z } from 'zod';
import type {
  userSchema,
  createUserSchema,
  updateUserSchema,
} from './users.schema';
import { userQuerySchema } from './users.schema';

/**
 * User entity type (inferred from Zod schema).
 */
export type User = z.infer<typeof userSchema>;

/**
 * Create user input type.
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update user input type.
 */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * User query parameters DTO.
 */
export class UserQuery extends createZodDto(userQuerySchema) {}

/**
 * Paginated response type.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
`;
  }

  private createUserDto(): string {
    return `import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from '../users.schema';

/**
 * DTO for creating a new user.
 * Validated using the createUserSchema Zod schema.
 */
export class CreateUserDto extends createZodDto(createUserSchema) {}
`;
  }

  private updateUserDto(): string {
    return `import { createZodDto } from 'nestjs-zod';
import { updateUserSchema } from '../users.schema';

/**
 * DTO for updating an existing user.
 * Validated using the updateUserSchema Zod schema.
 */
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
`;
  }

  private usersRepository(): string {
    return `import { Injectable, NotFoundException } from '@nestjs/common';
import type { User, CreateUserInput, UpdateUserInput, PaginatedResponse, UserQuery } from './users.types';
import { randomUUID } from 'node:crypto';

/**
 * Users repository — encapsulates all database access for the users feature.
 *
 * Currently uses an in-memory store for demonstration.
 * Replace with your ORM (Prisma, Drizzle, TypeORM) when database is configured.
 *
 * The rest of the application (services, controllers) should NOT need to change
 * when the underlying storage mechanism is swapped.
 */
@Injectable()
export class UsersRepository {
  // In-memory store — replace with actual database calls
  private readonly users: Map<string, User> = new Map();

  async findAll(query: UserQuery): Promise<PaginatedResponse<Omit<User, 'createdAt' | 'updatedAt'>>> {
    let items = Array.from(this.users.values());

    // Search filter
    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (user) =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search),
      );
    }

    const total = items.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const paginatedItems = items.slice(start, start + query.limit);

    return {
      items: paginatedItems.map(({ id, email, name }) => ({ id, email, name })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find((u) => u.email === email) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: input.email,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new NotFoundException(\`User with ID "\${id}" not found\`);
    }

    const updated: User = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };

    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new NotFoundException(\`User with ID "\${id}" not found\`);
    }
    this.users.delete(id);
  }
}
`;
  }

  private usersService(): string {
    return `import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type { User, CreateUserInput, UpdateUserInput, PaginatedResponse, UserQuery } from './users.types';

/**
 * Users service — contains all business logic for user management.
 *
 * Key rules:
 * - Business logic belongs HERE, not in controllers or repositories
 * - Controllers delegate to this service
 * - This service delegates database access to UsersRepository
 */
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Get a paginated list of users.
   */
  async findAll(query: UserQuery): Promise<PaginatedResponse<Omit<User, 'createdAt' | 'updatedAt'>>> {
    return this.usersRepository.findAll(query);
  }

  /**
   * Get a single user by ID.
   * @throws NotFoundException if user does not exist
   */
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(\`User with ID "\${id}" not found\`);
    }
    return user;
  }

  /**
   * Create a new user.
   * @throws ConflictException if email is already in use
   */
  async create(input: CreateUserInput): Promise<User> {
    // Business rule: email must be unique
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException(\`Email "\${input.email}" is already in use\`);
    }

    return this.usersRepository.create(input);
  }

  /**
   * Update an existing user.
   * @throws NotFoundException if user does not exist
   * @throws ConflictException if updated email is already in use by another user
   */
  async update(id: string, input: UpdateUserInput): Promise<User> {
    // Verify user exists
    await this.findById(id);

    // Business rule: if changing email, ensure it's not taken
    if (input.email) {
      const existing = await this.usersRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(\`Email "\${input.email}" is already in use\`);
      }
    }

    return this.usersRepository.update(id, input);
  }

  /**
   * Delete a user by ID.
   * @throws NotFoundException if user does not exist
   */
  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }
}
`;
  }

  private usersController(): string {
    if (this.config.auth === 'jwt') {
      return `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQuery } from './users.types';

/**
 * Users controller — thin HTTP layer.
 *
 * Responsibilities:
 * - Route definitions
 * - Request validation (global via nestjs-zod)
 * - Swagger documentation
 * - Delegating to UsersService
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users
   * Get a paginated list of users.
   */
  @Get()
  @ApiOperation({ summary: 'Get a paginated list of users' })
  @ApiResponse({ status: 200, description: 'Return paginated users list' })
  findAll(@Query() query: UserQuery) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /api/users/:id
   * Get a single user by ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'Return the user object' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * POST /api/users
   * Create a new user. Requires a valid JWT token.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * PUT /api/users/:id
   * Update an existing user. Requires a valid JWT token.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  /**
   * DELETE /api/users/:id
   * Delete a user. Requires a valid JWT token.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 204, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
`;
    }

    return `import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQuery } from './users.types';

/**
 * Users controller — thin HTTP layer.
 *
 * Responsibilities:
 * - Route definitions
 * - Request validation (global via nestjs-zod)
 * - Swagger documentation
 * - Delegating to UsersService
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of users' })
  @ApiResponse({ status: 200, description: 'Return paginated users list' })
  findAll(@Query() query: UserQuery) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'Return the user object' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User unique identifier' })
  @ApiResponse({ status: 204, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
`;
  }

  private usersModule(): string {
    return `import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
`;
  }

  // ─── Testing (Optional) ───────────────────────────────────────────────

  private jestConfig(): string {
    return `import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\\\.spec\\\\.ts$',
  transform: {
    '^.+\\\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.module.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
`;
  }

  private usersServiceSpec(): string {
    return `import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, UsersRepository],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securepassword123',
      };

      const user = await service.create(input);

      expect(user).toBeDefined();
      expect(user.email).toBe(input.email);
      expect(user.name).toBe(input.name);
      expect(user.id).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      const input = {
        email: 'duplicate@example.com',
        name: 'User One',
        password: 'securepassword123',
      };

      await service.create(input);

      await expect(
        service.create({ ...input, name: 'User Two' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      const created = await service.create({
        email: 'find@example.com',
        name: 'Find Me',
        password: 'securepassword123',
      });

      const found = await service.findById(created.id);
      expect(found.email).toBe('find@example.com');
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      await expect(
        service.findById('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const created = await service.create({
        email: 'delete@example.com',
        name: 'Delete Me',
        password: 'securepassword123',
      });

      await service.delete(created.id);

      await expect(
        service.findById(created.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
`;
  }

  // ─── Database: Prisma ─────────────────────────────────────────────────

  private prismaSchema(): string {
    return `// Prisma Schema
// Run \`bun run prisma:migrate\` to apply migrations.
// Run \`bun run prisma:generate\` to regenerate the client.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
`;
  }

  private prismaService(): string {
    return `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma service — wraps PrismaClient for dependency injection.
 * Handles connection lifecycle with NestJS module events.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;
  }

  // ─── Database: Drizzle ────────────────────────────────────────────────

  private drizzleConfig(): string {
    return `import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
} satisfies Config;
`;
  }

  private drizzleSchema(): string {
    return `import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table schema.
 * Add new tables here and run \`bun run db:generate\` to create migrations.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
  }

  private drizzleDb(): string {
    return `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);

/**
 * Drizzle database client.
 * Import this wherever you need database access.
 *
 * @example
 *   import { db } from '@/database/db';
 *   const users = await db.select().from(schema.users);
 */
export const db = drizzle(client, { schema });
`;
  }

  // ─── Auth: JWT ────────────────────────────────────────────────────────

  private authTypes(): string {
    return `/**
 * JWT payload shape — embedded in the token.
 */
export interface JwtPayload {
  sub: string;   // user ID
  email: string;
  iat?: number;  // issued at (set by @nestjs/jwt)
  exp?: number;  // expiry (set by @nestjs/jwt)
}

/**
 * Shape of the object returned after successful login.
 */
export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}
`;
  }

  private loginDto(): string {
    return `import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export class LoginDto extends createZodDto(loginSchema) {}
`;
  }

  private authGuard(): string {
    return `import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from './auth.types';

/**
 * JWT authentication guard.
 * Apply to any route or controller that requires a valid access token.
 *
 * @example
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getProfile(@Request() req) {
 *     return req.user;
 *   }
 */
@Injectable()
export class JwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      // Attach the payload to the request for use in route handlers
      (request as Request & { user: JwtPayload }).user = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
`;
  }

  private authService(): string {
    return `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository';
import type { LoginDto } from './dto/login.dto';
import type { AuthTokens, JwtPayload } from './auth.types';

/**
 * Auth service — handles login and token issuance.
 *
 * NOTE: Password hashing is intentionally NOT included in this scaffold.
 * You should add bcrypt (or argon2) before storing or comparing passwords:
 *   bun add bcrypt @types/bcrypt
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate credentials and return a signed JWT.
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // TODO: Replace this with a real password comparison:
    // const isValid = await bcrypt.compare(dto.password, user.password);
    // if (!isValid) throw new UnauthorizedException('Invalid email or password');

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      expiresIn: '7d',
    };
  }
}
`;
  }

  private authController(): string {
    return `import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * Auth controller — exposes login endpoint.
 *
 * POST /api/auth/login  → returns { accessToken, expiresIn }
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return a JWT access token' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
`;
  }

  private authModule(): string {
    return `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { UsersModule } from '../users/users.module';

/**
 * Auth module — provides JWT authentication.
 *
 * Exports JwtAuthGuard so it can be applied in other modules:
 *   @UseGuards(JwtAuthGuard)
 */
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'] ?? 'change-me',
      signOptions: { expiresIn: process.env['JWT_EXPIRATION'] ?? '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
`;
  }

  // ─── Per-App Env + Docker ─────────────────────────────────────────────

  private apiEnvExample(): string {
    const { projectName, database, auth } = this.config;
    return `# API Environment Variables
# Copy to .env and fill in your values.
# Run \`bun run env:encrypt\` from the monorepo root to encrypt for team sharing.

# ---- Application ----
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# ---- Database ----
${database === 'prisma' || database === 'drizzle' ? `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${projectName.replace(/-/g, '_')}_dev` : `# DATABASE_URL=postgresql://user:password@localhost:5432/${projectName.replace(/-/g, '_')}_dev`}

# ---- Authentication ----
${auth === 'jwt' ? 'JWT_SECRET=change-me-to-a-random-32-character-minimum-string\nJWT_EXPIRATION=7d' : '# JWT_SECRET=\n# JWT_EXPIRATION=7d'}

# ---- Redis (for worker, if enabled) ----
# REDIS_HOST=localhost
# REDIS_PORT=6379
`;
  }

  private apiDockerfile(): string {
    return `# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install Bun
RUN npm install -g bun

# Copy workspace manifests first for better layer caching
COPY package.json bun.lockb* ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/

RUN bun install --frozen-lockfile

# Copy source and build
COPY apps/api/ ./apps/api/
COPY tsconfig.base.json ./
RUN cd apps/api && bun run build

# ─── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]

# ─── Stage 3: Development ─────────────────────────────────────────────────────
FROM builder AS development
ENV NODE_ENV=development
WORKDIR /app/apps/api
CMD ["bun", "run", "dev"]
`;
  }
}
