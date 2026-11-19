import fs from "node:fs/promises";
import path from "node:path";
import type { ServerSummary } from "@kubekpanel/extension-sdk";

export interface ServerSchematicsInfo {
  id: string;
  name: string;
  plugin: "FastAsyncWorldEdit" | "WorldEdit";
  schematicsPath: string;
  isLinked: boolean;
}

export const KUBEK_ROOT = process.cwd();
export const GLOBAL_SCHEMATICS_DIR = path.join(KUBEK_ROOT, "global_schematics");

export async function ensureGlobalDir(): Promise<string> {
  await fs.mkdir(GLOBAL_SCHEMATICS_DIR, { recursive: true });
  return GLOBAL_SCHEMATICS_DIR;
}

export function resolveServerDir(srv: ServerSummary): string {
  const raw = srv as unknown as Record<string, unknown>;
  if (typeof raw.dir === "string" && raw.dir.length > 0) return raw.dir;
  if (typeof raw.path === "string" && raw.path.length > 0) return raw.path;
  if (typeof raw.directory === "string" && raw.directory.length > 0) return raw.directory;
  return path.join(KUBEK_ROOT, "servers", srv.id);
}

export async function detectSchematicsTarget(
  srv: ServerSummary,
): Promise<{ plugin: "FastAsyncWorldEdit" | "WorldEdit"; schematicsPath: string } | null> {
  const serverDir = resolveServerDir(srv);
  const pluginsDir = path.join(serverDir, "plugins");

  let entries: string[] = [];
  try {
    entries = await fs.readdir(pluginsDir);
  } catch {
    return null;
  }

  const lowerEntries = entries.map((e) => e.toLowerCase());
  const hasFawe = lowerEntries.some(
    (e) => e === "fastasyncworldedit" || e.startsWith("fastasyncworldedit"),
  );
  const hasWe = lowerEntries.some(
    (e) => e === "worldedit" || e.startsWith("worldedit"),
  );

  if (hasFawe) {
    return {
      plugin: "FastAsyncWorldEdit",
      schematicsPath: path.join(pluginsDir, "FastAsyncWorldEdit", "schematics"),
    };
  }

  if (hasWe) {
    return {
      plugin: "WorldEdit",
      schematicsPath: path.join(pluginsDir, "WorldEdit", "schematics"),
    };
  }

  return null;
}

export async function isSymlinkLinkedToGlobal(
  schematicsPath: string,
  globalDir: string,
): Promise<boolean> {
  try {
    const stat = await fs.lstat(schematicsPath);
    if (!stat.isSymbolicLink()) return false;
    const rawTarget = await fs.readlink(schematicsPath);
    const resolvedTarget = path.resolve(path.dirname(schematicsPath), rawTarget);
    return resolvedTarget === path.resolve(globalDir);
  } catch {
    return false;
  }
}

async function copyDirContents(srcDir: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirContents(srcPath, destPath);
    } else if (entry.isFile()) {
      try {
        await fs.access(destPath);
      } catch {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

export async function linkServerSchematics(
  schematicsPath: string,
  globalDir: string,
): Promise<void> {
  await fs.mkdir(path.dirname(schematicsPath), { recursive: true });

  try {
    const stat = await fs.lstat(schematicsPath);
    if (stat.isSymbolicLink()) {
      const rawTarget = await fs.readlink(schematicsPath);
      const resolvedTarget = path.resolve(path.dirname(schematicsPath), rawTarget);
      if (resolvedTarget === path.resolve(globalDir)) return;
      await fs.unlink(schematicsPath);
    } else if (stat.isDirectory()) {
      await copyDirContents(schematicsPath, globalDir);
      await fs.rm(schematicsPath, { recursive: true, force: true });
    } else {
      await fs.rm(schematicsPath, { force: true });
    }
  } catch {
    // Директория ещё не существует
  }

  await fs.symlink(globalDir, schematicsPath, "dir");
}

export async function unlinkServerSchematics(schematicsPath: string): Promise<void> {
  try {
    const stat = await fs.lstat(schematicsPath);
    if (stat.isSymbolicLink()) {
      await fs.unlink(schematicsPath);
      await fs.mkdir(schematicsPath, { recursive: true });
    }
  } catch {
    // Директория отсутствует
  }
}
