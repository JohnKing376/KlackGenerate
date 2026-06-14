import { execSync } from 'node:child_process';

/**
 * Initialize a git repository in the target directory.
 */
export async function initGitRepo(targetDir: string): Promise<void> {
  try {
    execSync('git init', {
      cwd: targetDir,
      stdio: 'ignore',
    });
    execSync('git add -A', {
      cwd: targetDir,
      stdio: 'ignore',
    });
    execSync('git commit -m "Initial commit from klack-generate-monorepo"', {
      cwd: targetDir,
      stdio: 'ignore',
    });
  } catch {
    // Git not available or init failed — non-critical, skip silently
  }
}

/**
 * Generate a comprehensive .gitignore for the monorepo.
 */
export function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnp.*
.yarn/

# Build outputs
dist/
build/
.next/
.expo/
out/

# Environment
.env
.env.local
.env.*.local
# dotenvx — encryption keys (NEVER commit)
.env.keys
# dotenvx — encrypted vault (safe to commit, listed here for clarity)
# .env.vault

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.jest/

# Turborepo
.turbo/

# Debug
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
*.tsbuildinfo
`;
}
