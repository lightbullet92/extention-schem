import { buildResult } from "./builder";
import type { NbtCompound, ParsedSchematic } from "./types";

function decodeVarIntArray(data: Uint8Array, expectedCount: number): number[] {
  const out = new Array<number>(expectedCount);
  let idx = 0;
  let count = 0;

  while (idx < data.length && count < expectedCount) {
    let value = 0;
    let shift = 0;
    while (true) {
      if (idx >= data.length) {
        throw new Error("Неожиданный конец VarInt-массива BlockData");
      }
      const byte = data[idx] ?? 0;
      idx += 1;
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
      if (shift > 35) {
        throw new Error("Некорректный VarInt в BlockData");
      }
    }
    out[count] = value;
    count += 1;
  }

  return out;
}

export function parseSpongeSchematic(root: NbtCompound): ParsedSchematic {
  const container = (root.Schematic as NbtCompound | undefined) ?? root;
  const width = Number(container.Width ?? 0);
  const height = Number(container.Height ?? 0);
  const length = Number(container.Length ?? 0);

  if (width <= 0 || height <= 0 || length <= 0) {
    throw new Error("Некорректные размеры Sponge-схематика");
  }

  const blocksBlock = container.Blocks as NbtCompound | undefined;
  const paletteObj = (blocksBlock?.Palette ?? container.Palette) as
    | NbtCompound
    | undefined;
  const blockData = (blocksBlock?.Data ?? container.BlockData) as
    | Uint8Array
    | undefined;

  if (!paletteObj || !(blockData instanceof Uint8Array)) {
    throw new Error("Отсутствует Palette или BlockData в .schem");
  }

  let maxId = 0;
  for (const val of Object.values(paletteObj)) {
    const num = Number(val);
    if (num > maxId) maxId = num;
  }

  const rawPalette = new Array<string>(maxId + 1).fill("minecraft:air");
  for (const [blockId, rawIdx] of Object.entries(paletteObj)) {
    rawPalette[Number(rawIdx)] = blockId;
  }

  const volume = width * height * length;
  const decodedIndices = decodeVarIntArray(blockData, volume);

  return buildResult("sponge", width, height, length, rawPalette, decodedIndices);
}
