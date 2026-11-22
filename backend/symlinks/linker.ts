import fs from "node:fs/promises";
import path from "node:path";
import { GLOBAL_SCHEMATICS_DIR } from "./types";

export async function ensureGlobalDir(): Promise<string> {
  await fs.mkdir(GLOBAL_SCHEMATICS_DIR, { recursive: true });
  return GLOBAL_SCHEMATICS_DIR;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

export async function isLinkedToGlobal(
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
  let entries: string[] = [];
  try {
    entries = await fs.readdir(srcDir);
  } catch {
    return;
  }

  for (const name of entries) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    const stat = await fs.lstat(srcPath);

    if (stat.isDirectory()) {
      await copyDirContents(srcPath, destPath);
    } else if (stat.isFile()) {
      if (!(await exists(destPath))) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

async function enableSymlinksInPluginConfig(pluginDir: string): Promise<void> {
  const candidates = ["config.yml", "worldedit-config.yml"];
  for (const fileName of candidates) {
    const cfgPath = path.join(pluginDir, fileName);
    try {
      const raw = await fs.readFile(cfgPath, "utf-8");
      if (/allow-symbolic-links:\s*false/i.test(raw)) {
        const updated = raw.replace(
          /allow-symbolic-links:\s*false/gi,
          "allow-symbolic-links: true",
        );
        await fs.writeFile(cfgPath, updated, "utf-8");
      }
    } catch {
      // Файл конфигурации отсутствует
    }
  }
}

export async function linkServerSchematics(
  schematicsPath: string,
  globalDir: string,
): Promise<void> {
  const pluginDir = path.dirname(schematicsPath);
  await fs.mkdir(pluginDir, { recursive: true });
  await enableSymlinksInPluginConfig(pluginDir);

  try {
    const stat = await fs.lstat(schematicsPath);
    if (stat.isSymbolicLink()) {
      const rawTarget = await fs.readlink(schematicsPath);
      const resolvedTarget = path.resolve(pluginDir, rawTarget);
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

export async function unlinkServerSchematics(
  schematicsPath: string,
  globalDir: string,
): Promise<void> {
  if (await isLinkedToGlobal(schematicsPath, globalDir)) {
    await fs.unlink(schematicsPath);
    await fs.mkdir(schematicsPath, { recursive: true });
  }
}
