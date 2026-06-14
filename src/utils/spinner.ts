import ora, { type Ora } from 'ora';

/**
 * Execute an async function with a spinner.
 * Shows the spinner while the function runs, then marks it as succeeded or failed.
 */
export async function withSpinner<T>(
  message: string,
  fn: (spinner: Ora) => Promise<T>,
): Promise<T> {
  const spinner = ora({
    text: message,
    color: 'magenta',
  }).start();

  try {
    const result = await fn(spinner);
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

/**
 * Create a raw spinner instance for manual control.
 */
export function createSpinner(message: string): Ora {
  return ora({
    text: message,
    color: 'magenta',
  });
}
