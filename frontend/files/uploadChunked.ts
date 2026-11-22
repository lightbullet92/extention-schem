import { EXT_ID } from "../i18n";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return window.btoa(binary);
}

export async function uploadSchematicInChunks(
  file: File,
  folder: string,
  onProgress: (percent: number) => void,
): Promise<string | undefined> {
  const http = window.Kubek?.http;
  if (!http) throw new Error("Kubek runtime API unavailable");

  const buffer = await file.arrayBuffer();
  const totalBytes = buffer.byteLength;
  const CHUNK_BYTES = 64 * 1024;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_BYTES));
  const uploadId = Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  let lastRes: { ok: boolean; name?: string } | null = null;
  for (let i = 0; i < totalChunks; i++) {
    const slice = buffer.slice(i * CHUNK_BYTES, Math.min(totalBytes, (i + 1) * CHUNK_BYTES));
    lastRes = (await http.post("ext/" + EXT_ID + "/schematics/upload", {
      uploadId,
      name: file.name,
      folder: folder.trim(),
      chunkIndex: i,
      totalChunks,
      dataBase64: arrayBufferToBase64(slice),
    })) as { ok: boolean; name?: string };
    onProgress(Math.round(((i + 1) / totalChunks) * 100));
  }

  return lastRes?.name;
}
