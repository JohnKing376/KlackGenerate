import chalk from 'chalk';

const PREFIX = chalk.hex('#7C3AED').bold('▸');

export const logger = {
  /** Informational message */
  info(message: string): void {
    console.log(`${PREFIX} ${message}`);
  },

  /** Success message */
  success(message: string): void {
    console.log(`${chalk.green('✔')} ${chalk.green(message)}`);
  },

  /** Warning message */
  warn(message: string): void {
    console.log(`${chalk.yellow('⚠')} ${chalk.yellow(message)}`);
  },

  /** Error message */
  error(message: string): void {
    console.error(`${chalk.red('✖')} ${chalk.red(message)}`);
  },

  /** Step message — used to show progress through phases */
  step(step: number, total: number, message: string): void {
    const counter = chalk.dim(`[${step}/${total}]`);
    console.log(`\n${PREFIX} ${counter} ${chalk.bold(message)}`);
  },

  /** Blank line */
  newline(): void {
    console.log();
  },

  /** Title banner */
  banner(text: string): void {
    console.log();
    console.log(chalk.hex('#7C3AED').bold(`  ${text}`));
    console.log(chalk.dim(`  ${'─'.repeat(text.length + 2)}`));
    console.log();
  },

  /** Dim helper text */
  dim(message: string): void {
    console.log(chalk.dim(`  ${message}`));
  },

  /** Key-value display */
  keyValue(key: string, value: string): void {
    console.log(`  ${chalk.dim(key + ':')} ${value}`);
  },
} as const;
