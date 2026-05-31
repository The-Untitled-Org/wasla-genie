import { readdir, readFile, writeFile, stat, mkdir, rm } from 'fs/promises';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function readJSON<T>(path: string): Promise<T> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
}

export async function writeJSON<T>(path: string, data: T): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeFile(path, content, 'utf-8');
}

export async function readText(path: string): Promise<string> {
  return readFile(path, 'utf-8');
}

export async function writeText(path: string, content: string): Promise<void> {
  await writeFile(path, content, 'utf-8');
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function removePath(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function listFiles(dir: string, extension?: string): Promise<string[]> {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    return files
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .filter((name) => !extension || name.endsWith(extension));
  } catch {
    return [];
  }
}

export async function listDirs(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    return files.filter((f) => f.isDirectory()).map((f) => f.name);
  } catch {
    return [];
  }
}

export function getFileName(path: string): string {
  return path.split(/[/\\]/).filter(Boolean).pop() || '';
}

export function getFileNameWithoutExt(path: string): string {
  const fileName = getFileName(path);
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) {
    return fileName;
  }
  return fileName.substring(0, dotIndex);
}

export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) {
    return '';
  }
  return fileName.substring(dotIndex + 1);
}
