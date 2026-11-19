import fs from "node:fs/promises";
import type {
  ExtRequest,
  ExtResponse,
  KubekExtensionContext,
} from "@kubekpanel/extension-sdk";
import { parseSchematicBuffer } from "./nbt";
import {
  collectSchematics,
  resolveSafeSchematicPath,
  saveUploadedChunk,
  type SchematicListItem,
} from "./files";
import {
  detectSchematicsTarget,
  ensureGlobalDir,
  isSymlinkLinkedToGlobal,
  linkServerSchematics,
  unlinkServerSchematics,
  type ServerSchematicsInfo,
} from "./symlinks";

export async function activate(ctx: KubekExtensionContext): Promise<void> {
  const globalDir = await ensureGlobalDir();
  ctx.logger.info("Global Schematics activated: " + globalDir);

  ctx.http.registerRoutes([
    {
      method: "GET",
      path: "/servers",
      permission: "ext.schematics.view",
      handler: async (_req: ExtRequest, res: ExtResponse) => {
        const dir = await ensureGlobalDir();
        const items: ServerSchematicsInfo[] = [];

        for (const srv of ctx.servers.list()) {
          const target = await detectSchematicsTarget(srv);
          if (!target) continue;

          const isLinked = await isSymlinkLinkedToGlobal(target.schematicsPath, dir);
          items.push({
            id: srv.id,
            name: srv.name,
            plugin: target.plugin,
            schematicsPath: target.schematicsPath,
            isLinked,
          });
        }

        items.sort((a, b) => a.name.localeCompare(b.name));
        res.json({ globalDir: dir, servers: items });
      },
    },
    {
      method: "POST",
      path: "/sync",
      permission: "ext.schematics.manage",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        const dir = await ensureGlobalDir();
        const body = req.body as { enabledIds?: string[] } | null;
        const enabledSet = new Set((body?.enabledIds ?? []) as string[]);

        for (const srv of ctx.servers.list()) {
          const target = await detectSchematicsTarget(srv);
          if (!target) continue;

          if (enabledSet.has(srv.id)) {
            await linkServerSchematics(target.schematicsPath, dir);
          } else {
            await unlinkServerSchematics(target.schematicsPath);
          }
        }

        res.json({ ok: true });
      },
    },
    {
      method: "GET",
      path: "/schematics",
      permission: "ext.schematics.view",
      handler: async (_req: ExtRequest, res: ExtResponse) => {
        const dir = await ensureGlobalDir();
        const files: SchematicListItem[] = [];
        await collectSchematics(dir, dir, files);
        files.sort((a, b) => a.name.localeCompare(b.name));
        res.json({ files });
      },
    },
    {
      method: "POST",
      path: "/schematics/inspect",
      permission: "ext.schematics.view",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        const body = req.body as { name?: string } | null;
        const dir = await ensureGlobalDir();
        const filePath = resolveSafeSchematicPath(dir, body?.name ?? "");

        if (!filePath) {
          res.status(400).json({ error: "Некорректный путь к файлу" });
          return;
        }

        try {
          const buf = await fs.readFile(filePath);
          const parsed = parseSchematicBuffer(new Uint8Array(buf));
          res.json({ name: (body?.name ?? "").trim(), ...parsed });
        } catch (err) {
          res.status(400).json({ error: "Ошибка чтения схематика: " + String(err) });
        }
      },
    },
    {
      method: "POST",
      path: "/schematics/upload",
      permission: "ext.schematics.upload",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        try {
          const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          const body = rawBody as {
            uploadId?: string;
            name?: string;
            folder?: string;
            chunkIndex?: number;
            totalChunks?: number;
            dataBase64?: string;
          } | null;

          const dir = await ensureGlobalDir();
          const result = await saveUploadedChunk({
            baseDir: dir,
            uploadId: body?.uploadId ?? "",
            fileName: body?.name ?? "",
            folder: body?.folder ?? "",
            chunkIndex: Number(body?.chunkIndex ?? 0),
            totalChunks: Number(body?.totalChunks ?? 1),
            dataBase64: (body?.dataBase64 ?? "").trim(),
          });

          res.json({ ok: true, ...result });
        } catch (err) {
          ctx.logger.error("Schematic upload failed", err);
          res.status(400).json({ error: "Ошибка загрузки: " + String(err) });
        }
      },
    },
    {
      method: "POST",
      path: "/schematics/delete",
      permission: "ext.schematics.manage",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        const body = req.body as { name?: string } | null;
        const dir = await ensureGlobalDir();
        const filePath = resolveSafeSchematicPath(dir, body?.name ?? "");

        if (!filePath) {
          res.status(400).json({ error: "Некорректный путь к файлу" });
          return;
        }

        await fs.rm(filePath, { force: true });
        res.json({ ok: true });
      },
    },
  ]);
}
