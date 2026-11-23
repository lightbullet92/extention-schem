import type {
  ExtRequest,
  ExtResponse,
  KubekExtensionContext,
} from "@kubekpanel/extension-sdk";
import {
  detectSchematicsTarget,
  ensureGlobalDir,
  isSymlinkLinkedToGlobal,
  linkServerToGlobal,
  unlinkServerFromGlobal,
  type ServerSymlinkState,
} from "../symlinks";

export function createServerRoutes(ctx: KubekExtensionContext) {
  return [
    {
      method: "GET" as const,
      path: "/servers",
      permission: "ext.schematics.view",
      handler: async (_req: ExtRequest, res: ExtResponse) => {
        const globalDir = await ensureGlobalDir();
        const servers = ctx.servers.list();
        const result: Array<ServerSymlinkState & { isLinked: boolean }> = [];

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
            isLinked: linked,
          });
        }

        res.json({ globalDir, servers: result });
      },
    },
    {
      method: "POST" as const,
      path: "/sync",
      permission: "ext.schematics.manage",
      handler: async (req: ExtRequest, res: ExtResponse) => {
        try {
          const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          const body = rawBody as { enabledIds?: string[]; serverIds?: string[] } | null;
          const ids = body?.enabledIds ?? body?.serverIds ?? [];
          const selectedSet = new Set(ids);
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
  ];
}
