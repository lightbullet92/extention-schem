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

export interface SaveChunkParams {
  baseDir: string;
  uploadId: string;
  fileName: string;
  folder?: string;
  chunkIndex: number;
  totalChunks: number;
  dataBase64: string;
}

export async function saveUploadedChunk(
  params: SaveChunkParams,
): Promise<{ completed: boolean; name?: string }> {
  const cleanFileName = path.basename(params.fileName.trim());
  if (!cleanFileName || !isSchematicFile(cleanFileName)) {
    throw new Error("Поддерживаются только файлы .schem, .schematic и .litematic");
  }

  const total = Math.max(1, params.totalChunks);
  const idx = params.chunkIndex;
  if (idx < 0 || idx >= total) {
    throw new Error("Некорректный индекс чанка");
  }

  const now = Date.now();
  for (const [key, item] of pendingUploads.entries()) {
    if (now - item.updatedAt > 10 * 60 * 1000) {
      pendingUploads.delete(key);
    }
  }

  let entry = pendingUploads.get(params.uploadId);
  if (!entry) {
    entry = {
      chunks: new Array<Uint8Array | null>(total).fill(null),
      received: 0,
      updatedAt: now,
    };
    pendingUploads.set(params.uploadId, entry);
  }

  const chunkBytes = new Uint8Array(Buffer.from(params.dataBase64, "base64"));
  if (entry.chunks[idx] === null) {
    entry.received += 1;
  }
  entry.chunks[idx] = chunkBytes;
  entry.updatedAt = now;

  if (entry.received < total) {
    return { completed: false };
  }

  pendingUploads.delete(params.uploadId);

  const totalSize = entry.chunks.reduce((sum, c) => sum + (c ? c.length : 0), 0);
  const fullBuffer = new Uint8Array(totalSize);
  let offset = 0;
  for (const c of entry.chunks) {
    if (c) {
      fullBuffer.set(c, offset);
      offset += c.length;
    }
  }

  parseSchematicBuffer(fullBuffer);

  const cleanFolder = sanitizeFolder(params.folder ?? "");
  const relPath = cleanFolder ? cleanFolder + "/" + cleanFileName : cleanFileName;
  const targetPath = resolveSafeFilePath(params.baseDir, relPath);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, fullBuffer);

  return { completed: true, name: relPath };
}
