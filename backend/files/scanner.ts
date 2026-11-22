import fs from "node:fs/promises";
import path from "node:path";
import { isSchematicFile } from "./paths";

export interface SchematicFileInfo {
  name: string;
  size: number;
  updatedAt: number;
}

export async function listSchematics(baseDir: string): Promise<SchematicFileInfo[]> {
  await fs.mkdir(baseDir, { recursive: true });
  const results: SchematicFileInfo[] = [];

  async function walk(currentDir: string, prefix: string): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const relPath = prefix ? prefix + "/" + entry : entry;
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await walk(fullPath, relPath);
        } else if (stat.isFile() && isSchematicFile(entry)) {
          results.push({
            name: relPath,
            size: stat.size,
            updatedAt: stat.mtimeMs,
          });
        }
      } catch {
        // Пропускаем недоступные элементы
      }
    }
  }

  await walk(baseDir, "");
  return results.sort((a, b) => a.name.localeCompare(b.name));
}
