import fs from "node:fs/promises";
import path from "node:path";
import type { ServerSummary } from "@kubekpanel/extension-sdk";
import type { DetectedPlugin } from "./types";

const KUBEK_ROOT = process.cwd();

export function resolveServerDir(srv: ServerSummary): string {
  const raw = srv as unknown as Record<string, unknown>;
  if (typeof raw.dir === "string" && raw.dir.length > 0) return raw.dir;
  if (typeof raw.path === "string" && raw.path.length > 0) return raw.path;
  if (typeof raw.directory === "string" && raw.directory.length > 0) return raw.directory;
  return path.join(KUBEK_ROOT, "servers", srv.id);
}

export async function detectSchematicPlugin(
  srv: ServerSummary,
): Promise<DetectedPlugin | null> {
  const pluginsDir = path.join(resolveServerDir(srv), "plugins");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(pluginsDir);
  } catch {
    return null;
  }

  const hasFawe = entries.some(
    (name) =>
      name === "FastAsyncWorldEdit" ||
      (name.toLowerCase().includes("fastasyncworldedit") && name.endsWith(".jar")),
  );
  if (hasFawe) {
    return {
      plugin: "FastAsyncWorldEdit",
      schematicsPath: path.join(pluginsDir, "FastAsyncWorldEdit", "schematics"),
    };
  }

  const hasWe = entries.some(
    (name) =>
      name === "WorldEdit" ||
      (name.toLowerCase().startsWith("worldedit") && name.endsWith(".jar")),
  );
  if (hasWe) {
    return {
      plugin: "WorldEdit",
      schematicsPath: path.join(pluginsDir, "WorldEdit", "schematics"),
    };
  }

  return null;
}
