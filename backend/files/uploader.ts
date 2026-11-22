import fs from "node:fs/promises";
import path from "node:path";
import { parseSchematicBuffer } from "../nbt";
import { isSchematicFile, resolveSafeFilePath, sanitizeFolder } from "./paths";

interface PendingUpload {
  chunks: Array<Uint8Array | null>;
  received: number;
  updatedAt: number;
}

const pendingUploads = new Map<string, PendingUpload>();

export interface ChunkUploadPayload {
  uploadId: string;
  name: string;
  folder?: string;
  chunkIndex: number;
  totalChunks: number;
  dataBase64: string;
}

export async function handleChunkedUpload(
  baseDir: string,
  payload: ChunkUploadPayload,
): Promise<{ ok: boolean; completed: boolean; name?: string }> {
  const cleanFileName = path.basename(payload.name.trim());
  if (!cleanFileName || !isSchematicFile(cleanFileName)) {
    throw new Error("Поддерживаются только файлы .schem, .schematic и .litematic");
  }

  const total = Math.max(1, payload.totalChunks);
  const idx = payload.chunkIndex;
  if (idx < 0 || idx >= total) {
    throw new Error("Некорректный индекс чанка");
  }

  // Очищаем зависшие загрузки старше 10 минут
  const now = Date.now();
  for (const [key, item] of pendingUploads.entries()) {
    if (now - item.updatedAt > 10 * 60 * 1000) {
      pendingUploads.delete(key);
    }
  }

  let entry = pendingUploads.get(payload.uploadId);
  if (!entry) {
    entry = {
      chunks: new Array<Uint8Array | null>(total).fill(null),
      received: 0,
      updatedAt: now,
    };
    pendingUploads.set(payload.uploadId, entry);
  }

  const chunkBytes = new Uint8Array(Buffer.from(payload.dataBase64, "base64"));
  if (entry.chunks[idx] === null) {
    entry.received += 1;
  }
  entry.chunks[idx] = chunkBytes;
  entry.updatedAt = now;

  if (entry.received < total) {
    return { ok: true, completed: false };
  }

  pendingUploads.delete(payload.uploadId);

  const totalSize = entry.chunks.reduce((sum, c) => sum + (c ? c.length : 0), 0);
  const fullBuffer = new Uint8Array(totalSize);
  let offset = 0;
  for (const c of entry.chunks) {
    if (c) {
      fullBuffer.set(c, offset);
      offset += c.length;
    }
  }

  // Валидируем NBT-структуру перед записью на диск
  parseSchematicBuffer(fullBuffer);

  const cleanFolder = sanitizeFolder(payload.folder ?? "");
  const relPath = cleanFolder ? cleanFolder + "/" + cleanFileName : cleanFileName;
  const targetPath = resolveSafeFilePath(baseDir, relPath);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, fullBuffer);

  return { ok: true, completed: true, name: relPath };
}
