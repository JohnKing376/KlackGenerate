import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Ensure a directory exists, creating it and all parents if needed.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Write content to a file, creating parent directories as needed.
 */
export async function writeTemplateFile(
  targetPath: string,
  content: string,
): Promise<void> {
  await ensureDir(dirname(targetPath));
  await writeFile(targetPath, content, 'utf-8');
}

/**
 * Write a .gitkeep file to ensure an empty directory is tracked by git.
 */
export async function writeGitKeep(dirPath: string): Promise<void> {
  await ensureDir(dirPath);
  await writeFile(join(dirPath, '.gitkeep'), '', 'utf-8');
}

/**
 * Check if a directory exists and is non-empty.
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  return existsSync(dirPath);
}

/**
 * Check if a directory is empty.
 */
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  if (!existsSync(dirPath)) return true;
  const entries = await readdir(dirPath);
  return entries.length === 0;
}

/**
 * Write multiple files from a record of { relativePath: content }.
 */
export async function writeFiles(
  baseDir: string,
  files: Record<string, string>,
): Promise<void> {
  const writePromises = Object.entries(files).map(([relativePath, content]) =>
    writeTemplateFile(join(baseDir, relativePath), content),
  );
  await Promise.all(writePromises);
}
