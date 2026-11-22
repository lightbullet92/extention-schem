import type { KubekExtensionContext } from "@kubekpanel/extension-sdk";
import { createSchematicRoutes } from "./routes/schematics";
import { createServerRoutes } from "./routes/servers";

export async function activate(ctx: KubekExtensionContext): Promise<void> {
  ctx.logger.info("Global Schematics & 3D Viewer activated");

  ctx.http.registerRoutes([
    ...createServerRoutes(ctx),
    ...createSchematicRoutes(ctx),
  ]);
}
