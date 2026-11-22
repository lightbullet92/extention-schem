import type { ParsedSchematic } from "./types";

export function stripBlockState(fullId: string): string {
  const bracketIdx = fullId.indexOf("[");
  return bracketIdx >= 0 ? fullId.slice(0, bracketIdx) : fullId;
}

export function isAirBlock(blockId: string): boolean {
  const clean = stripBlockState(blockId).toLowerCase();
  return (
    clean === "minecraft:air" ||
    clean === "minecraft:cave_air" ||
    clean === "minecraft:void_air" ||
    clean === "air"
  );
}

export function buildResult(
  format: "sponge" | "mcedit" | "litematic",
  width: number,
  height: number,
  length: number,
  rawPalette: string[],
  rawBlocks: number[],
): ParsedSchematic {
  const palette: string[] = ["minecraft:air"];
  const remap = new Map<number, number>();

  for (let i = 0; i < rawPalette.length; i++) {
    const blockName = rawPalette[i] ?? "minecraft:air";
    if (isAirBlock(blockName)) {
      remap.set(i, 0);
    } else {
      const cleanName = stripBlockState(blockName);
      let existingIdx = palette.indexOf(cleanName);
      if (existingIdx < 0) {
        existingIdx = palette.length;
        palette.push(cleanName);
      }
      remap.set(i, existingIdx);
    }
  }

  const volume = width * height * length;
  const blocks = new Array<number>(volume).fill(0);
  const counts = new Map<string, number>();
  let totalBlocks = 0;

  for (let i = 0; i < Math.min(volume, rawBlocks.length); i++) {
    const mappedIdx = remap.get(rawBlocks[i] ?? 0) ?? 0;
    blocks[i] = mappedIdx;
    if (mappedIdx > 0) {
      totalBlocks += 1;
      const bName = palette[mappedIdx] ?? "minecraft:stone";
      counts.set(bName, (counts.get(bName) ?? 0) + 1);
    }
  }

  const materials = Array.from(counts.entries())
    .map(([block, count]) => ({ block, count }))
    .sort((a, b) => b.count - a.count);

  return {
    format,
    width,
    height,
    length,
    totalBlocks,
    palette,
    blocks,
    materials,
  };
}
