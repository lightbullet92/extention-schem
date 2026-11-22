import { buildResult } from "./builder";
import { mapLegacyBlockId } from "./legacyIds";
import type { NbtCompound, ParsedSchematic } from "./types";

export function parseMcEditSchematic(root: NbtCompound): ParsedSchematic {
  const width = Number(root.Width ?? 0);
  const height = Number(root.Height ?? 0);
  const length = Number(root.Length ?? 0);
  const blocksBytes = root.Blocks as Uint8Array | undefined;

  if (width <= 0 || height <= 0 || length <= 0 || !(blocksBytes instanceof Uint8Array)) {
    throw new Error("Некорректный формат MCEdit .schematic");
  }

  const addBytes = root.AddBlocks as Uint8Array | undefined;
  const volume = width * height * length;
  const idToPaletteIdx = new Map<number, number>();
  const rawPalette: string[] = [];
  const rawBlocks = new Array<number>(volume).fill(0);

  for (let i = 0; i < Math.min(volume, blocksBytes.length); i++) {
    let blockId = (blocksBytes[i] ?? 0) & 0xff;
    if (addBytes && i >> 1 < addBytes.length) {
      const addByte = addBytes[i >> 1] ?? 0;
      const nibble = (i & 1) === 0 ? addByte & 0x0f : (addByte >> 4) & 0x0f;
      blockId |= nibble << 8;
    }

    let pIdx = idToPaletteIdx.get(blockId);
    if (pIdx === undefined) {
      pIdx = rawPalette.length;
      rawPalette.push(mapLegacyBlockId(blockId));
      idToPaletteIdx.set(blockId, pIdx);
    }
    rawBlocks[i] = pIdx;
  }

  return buildResult("mcedit", width, height, length, rawPalette, rawBlocks);
}
