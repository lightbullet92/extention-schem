import fs from "node:fs/promises";
import path from "node:path";
import { parseSchematicBuffer } from "./nbt";

export interface SchematicListItem {
  name: string;
  size: number;
  updatedAt: number;
}

export function normalizeSlashes(input: string): string {
  return input
    .trim()
    .split("/")
    .join(String.fromCharCode(92))
    .split(String.fromCharCode(92))
    .filter(Boolean)
    .join("/");
}

export function resolveSafeSchematicPath(baseDir: string, relName: string): string | null {
  const cleanRel = normalizeSlashes(relName);
  if (!cleanRel) return null;

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, cleanRel);

  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedTarget;
}

export async function collectSchematics(
  baseDir: string,
  currentDir: string,
  out: SchematicListItem[],
): Promise<void> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".uploads_tmp") continue;
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await collectSchematics(baseDir, fullPath, out);
      continue;
    }
    if (!entry.isFile()) continue;

    const lower = entry.name.toLowerCase();
    if (!lower.endsWith(".schem") && !lower.endsWith(".schematic")) continue;

    const stat = await fs.stat(fullPath);
    const relPath = normalizeSlashes(path.relative(baseDir, fullPath));
    out.push({
      name: relPath,
      size: stat.size,
      updatedAt: stat.mtimeMs,
    });
  }
}

export async function saveUploadedChunk(params: {
  baseDir: string;
  uploadId: string;
  fileName: string;
  folder: string;
  chunkIndex: number;
  totalChunks: number;
  dataBase64: string;
}): Promise<{ partial: boolean; name?: string }> {
  const rawName = path.basename(params.fileName.trim());
  const lower = rawName.toLowerCase();
  if (!rawName || (!lower.endsWith(".schem") && !lower.endsWith(".schematic"))) {
    throw new Error("Допускаются только файлы .schem и .schematic");
  }

  const safeId = params.uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId || !params.dataBase64 || params.totalChunks < 1 || params.chunkIndex < 0) {
    throw new Error("Некорректные параметры загрузки");
  }

  const tmpDir = path.join(params.baseDir, ".uploads_tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const tmpFile = path.join(tmpDir, safeId + ".part");
  const chunkBytes = Buffer.from(params.dataBase64, "base64");

  if (params.chunkIndex === 0) {
    await fs.writeFile(tmpFile, chunkBytes);
  } else {
    await fs.appendFile(tmpFile, chunkBytes);
  }

  if (params.chunkIndex + 1 < params.totalChunks) {
    return { partial: true };
  }

  const fullBuf = await fs.readFile(tmpFile);
  await fs.rm(tmpFile, { force: true });

  if (fullBuf.byteLength === 0 || fullBuf.byteLength > 25 * 1024 * 1024) {
    throw new Error("Размер файла должен быть от 1 байта до 25 МБ");
  }

  parseSchematicBuffer(new Uint8Array(fullBuf));

  const cleanFolder = normalizeSlashes(params.folder);
  const relTarget = cleanFolder ? cleanFolder + "/" + rawName : rawName;
  const targetPath = resolveSafeSchematicPath(params.baseDir, relTarget);

  if (!targetPath) {
    throw new Error("Некорректный путь сохранения");
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, fullBuf);

  return { partial: false, name: relTarget };
}
