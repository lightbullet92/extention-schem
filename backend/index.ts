import fs from "node:fs/promises";
import type {
  ExtRequest,
  ExtResponse,
  KubekExtensionContext,
} from "@kubekpanel/extension-sdk";
import {
  collectSchematics,
  resolveSafeSchematicPath,
  saveUploadedChunk,
} from "./files";
import { parseSchematicBuffer } from "./nbt";
import {
  detectSchematicsTarget,
  ensureGlobalDir,
  isSymlinkLinkedToGlobal,
  linkServerToGlobal,
  unlinkServerFromGlobal,
  type ServerSymlinkState,
} from "./symlinks";

function encodeBlocksRle(blocks: number[]): number[] {
  const rle: number[] = [];
  let i = 0;
  while (i < blocks.length) {
    const val = blocks[i] ?? 0;
    let count = 1;
    while (i + count < blocks.length && blocks[i + count] === val) {
      count += 1;
    }
    rle.push(val, count);
    i += count;
  }
  return rle;
}

export async function activate(ctx: KubekExtensionContext): Promise<void> {
  ctx.logger.info("Global Schematics & 3D Viewer activated");

  ctx.http.registerRoutes([
    {
      method: "GET",
      path: "/servers",
      permission: "ext.schematics.view",
      handler: async (_req: ExtRequest, res: ExtResponse) => {
        const globalDir = await ensureGlobalDir();
        const servers = ctx.servers.list();
        const result: ServerSymlinkState[] = [];

        for (const srv of servers) {
          const target = await detectSchematicsTarget(srv);
          if (!target) continue;
          const linked = await isSymlinkLinkedToGlobal(
            target.schematicsPath,
            globalDir,
          );
          result.push({
            id: srv.id,
            name: srv.name,
            status: String(srv.status),
            plugin: target.plugin,
            schematicsPath: target.schematicsPath,
            linked,
          });
        }

        res.json({ servers: result });
      },
    },
    {
      method: "POST",
      path: "/sync",
      permission: "ext.schematics.manage",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        try {
          const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          const body = rawBody as { serverIds?: string[] } | null;
          const selectedSet = new Set(body?.serverIds ?? []);
          const globalDir = await ensureGlobalDir();
          const servers = ctx.servers.list();

          for (const srv of servers) {
            const target = await detectSchematicsTarget(srv);
            if (!target) continue;

            if (selectedSet.has(srv.id)) {
              await linkServerToGlobal(target.schematicsPath, globalDir);
            } else {
              await unlinkServerFromGlobal(target.schematicsPath, globalDir);
            }
          }

          res.json({ ok: true });
        } catch (err) {
          ctx.logger.error("Failed to sync server symlinks", err);
          res.status(500).json({ error: String(err) });
        }
      },
    },
    {
      method: "GET",
      path: "/schematics",
      permission: "ext.schematics.view",
      handler: async (_req: ExtRequest, res: ExtResponse) => {
        const dir = await ensureGlobalDir();
        const files = await collectSchematics(dir);
        res.json({ files });
      },
    },
    {
      method: "POST",
      path: "/schematics/inspect",
      permission: "ext.schematics.view",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        try {
          const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          const body = rawBody as { name?: string } | null;
          const name = String(body?.name ?? req.query?.name ?? "");
          if (!name) {
            res.status(400).json({ error: "Не указано имя файла" });
            return;
          }

          const dir = await ensureGlobalDir();
          const filePath = resolveSafeSchematicPath(dir, name);
          const stat = await fs.stat(filePath);
          const buf = new Uint8Array(await fs.readFile(filePath));
          const parsed = parseSchematicBuffer(buf);

          const { blocks, ...rest } = parsed;
          res.json({
            name,
            size: stat.size,
            ...rest,
            blocksRle: encodeBlocksRle(blocks),
          });
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
        try {
          const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          const body = rawBody as { name?: string } | null;
          const name = body?.name ?? "";
          if (!name) {
            res.status(400).json({ error: "Не указано имя файла" });
            return;
          }

          const dir = await ensureGlobalDir();
          const filePath = resolveSafeSchematicPath(dir, name);
          await fs.unlink(filePath);
          res.json({ ok: true });
        } catch (err) {
          res.status(400).json({ error: "Ошибка удаления: " + String(err) });
        }
      },
    },
  ]);
}
