import { confirm } from '@inquirer/prompts';

/**
 * Ask whether to include Docker support (Dockerfiles + docker-compose.yml).
 */
export async function promptDocker(): Promise<boolean> {
  return confirm({
    message: 'Include Docker support? (Dockerfile + docker-compose.yml)',
    default: true,
  });
}
