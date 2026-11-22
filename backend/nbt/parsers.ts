import { parseLitematicSchematic } from "./litematic";
import { parseMcEditSchematic } from "./mcedit";
import { readRootNbt } from "./reader";
import { parseSpongeSchematic } from "./sponge";
import type { ParsedSchematic } from "./types";

export function parseSchematicBuffer(rawBuffer: Uint8Array): ParsedSchematic {
  const root = readRootNbt(rawBuffer);
  if (root.Regions && typeof root.Regions === "object") {
    return parseLitematicSchematic(root);
  }
  if (root.Blocks instanceof Uint8Array) {
    return parseMcEditSchematic(root);
  }
  return parseSpongeSchematic(root);
}
