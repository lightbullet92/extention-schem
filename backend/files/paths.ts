import path from "node:path";

export const ALLOWED_EXTENSIONS = [".schem", ".schematic", ".litematic"];

export function isSchematicFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function sanitizeFolder(rawFolder: string): string {
  return rawFolder
    .replace(/\\/g, "/")
    .split("/")
    .map((seg) => seg.trim())
    .filter((seg) => seg.length > 0 && seg !== "." && seg !== "..")
    .join("/");
}

export function resolveSafeFilePath(baseDir: string, relName: string): string {
  const normalized = relName.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, normalized);

  if (
    resolvedTarget !== resolvedBase &&
    !resolvedTarget.startsWith(resolvedBase + path.sep)
  ) {
    throw new Error("Недопустимый путь к файлу");
  }
  return resolvedTarget;
}
