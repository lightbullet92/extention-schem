import type { NbtCompound, ParsedSchematic } from "./types";

function isAir(name: string): boolean {
  const clean = name.toLowerCase();
  return (
    clean === "minecraft:air" ||
    clean === "minecraft:cave_air" ||
    clean === "minecraft:void_air" ||
    clean === "air"
  );
}

/** Распаковывает плотно упакованный массив 64-битных Long из Litematica */
function unpackLitematicStates(
  longs: BigInt64Array,
  bitsPerEntry: number,
  totalBlocks: number,
): number[] {
  const out = new Array<number>(totalBlocks).fill(0);
  const mask = (1n << BigInt(bitsPerEntry)) - 1n;

  for (let i = 0; i < totalBlocks; i++) {
    const startBit = i * bitsPerEntry;
    const startLong = startBit >> 6;
    const endLong = ((i + 1) * bitsPerEntry - 1) >> 6;
    const bitOffset = BigInt(startBit & 0x3f);

    const low = BigInt.asUintN(64, longs[startLong] ?? 0n);
    let val: bigint;

    if (startLong === endLong) {
      val = (low >> bitOffset) & mask;
    } else {
      const high = BigInt.asUintN(64, longs[endLong] ?? 0n);
      const shiftHigh = 64n - bitOffset;
      val = ((low >> bitOffset) | (high << shiftHigh)) & mask;
    }

    out[i] = Number(val);
  }

  return out;
}

export function parseLitematicSchematic(root: NbtCompound): ParsedSchematic {
  const regions = root.Regions as NbtCompound | undefined;
  if (!regions || typeof regions !== "object") {
    throw new Error("Отсутствует секция Regions в файле .litematic");
  }

  interface RegionBox {
    minX: number;
    minY: number;
    minZ: number;
    absX: number;
    absY: number;
    absZ: number;
    paletteNames: string[];
    states: number[];
  }

  const parsedRegions: RegionBox[] = [];
  let globalMinX = Number.POSITIVE_INFINITY;
  let globalMinY = Number.POSITIVE_INFINITY;
  let globalMinZ = Number.POSITIVE_INFINITY;
  let globalMaxX = Number.NEGATIVE_INFINITY;
  let globalMaxY = Number.NEGATIVE_INFINITY;
  let globalMaxZ = Number.NEGATIVE_INFINITY;

  for (const regVal of Object.values(regions)) {
    const reg = regVal as NbtCompound;
    const pos = reg.Position as NbtCompound | undefined;
    const size = reg.Size as NbtCompound | undefined;
    const rawPalette = reg.BlockStatePalette as NbtCompound[] | undefined;
    const blockStates = reg.BlockStates as BigInt64Array | undefined;

    if (!pos || !size || !Array.isArray(rawPalette) || !(blockStates instanceof BigInt64Array)) {
      continue;
    }

    const px = Number(pos.x ?? 0);
    const py = Number(pos.y ?? 0);
    const pz = Number(pos.z ?? 0);
    const sx = Number(size.x ?? 0);
    const sy = Number(size.y ?? 0);
    const sz = Number(size.z ?? 0);

    const absX = Math.abs(sx);
    const absY = Math.abs(sy);
    const absZ = Math.abs(sz);
    if (absX === 0 || absY === 0 || absZ === 0) continue;

    // В Litematica отрицательный Size означает направление выделения в минус от Position
    const minX = sx >= 0 ? px : px + sx + 1;
    const minY = sy >= 0 ? py : py + sy + 1;
    const minZ = sz >= 0 ? pz : pz + sz + 1;

    globalMinX = Math.min(globalMinX, minX);
    globalMinY = Math.min(globalMinY, minY);
    globalMinZ = Math.min(globalMinZ, minZ);
    globalMaxX = Math.max(globalMaxX, minX + absX);
    globalMaxY = Math.max(globalMaxY, minY + absY);
    globalMaxZ = Math.max(globalMaxZ, minZ + absZ);

    const paletteNames = rawPalette.map((entry) => String(entry.Name ?? "minecraft:air"));
    const bits = Math.max(2, Math.ceil(Math.log2(Math.max(2, paletteNames.length))));
    const states = unpackLitematicStates(blockStates, bits, absX * absY * absZ);

    parsedRegions.push({
      minX,
      minY,
      minZ,
      absX,
      absY,
      absZ,
      paletteNames,
      states,
    });
  }

  if (parsedRegions.length === 0) {
    throw new Error("В файле .litematic не найдено валидных регионов");
  }

  const width = globalMaxX - globalMinX;
  const height = globalMaxY - globalMinY;
  const length = globalMaxZ - globalMinZ;
  const volume = width * height * length;

  const palette: string[] = ["minecraft:air"];
  const paletteIndexMap = new Map<string, number>();
  const blocks = new Array<number>(volume).fill(0);
  const counts = new Map<string, number>();
  let totalBlocks = 0;

  for (const reg of parsedRegions) {
    const localMap = reg.paletteNames.map((name) => {
      if (isAir(name)) return 0;
      let idx = paletteIndexMap.get(name);
      if (idx === undefined) {
        idx = palette.length;
        palette.push(name);
        paletteIndexMap.set(name, idx);
      }
      return idx;
    });

    for (let y = 0; y < reg.absY; y++) {
      for (let z = 0; z < reg.absZ; z++) {
        for (let x = 0; x < reg.absX; x++) {
          const localIdx = (y * reg.absZ + z) * reg.absX + x;
          const stateIdx = reg.states[localIdx] ?? 0;
          const globalPaletteIdx = localMap[stateIdx] ?? 0;
          if (globalPaletteIdx === 0) continue;

          const gx = reg.minX - globalMinX + x;
          const gy = reg.minY - globalMinY + y;
          const gz = reg.minZ - globalMinZ + z;
          const globalPos = (gy * length + gz) * width + gx;

          if (blocks[globalPos] === 0) {
            totalBlocks += 1;
          }
          blocks[globalPos] = globalPaletteIdx;

          const bName = palette[globalPaletteIdx] ?? "minecraft:stone";
          counts.set(bName, (counts.get(bName) ?? 0) + 1);
        }
      }
    }
  }

  const materials = Array.from(counts.entries())
    .map(([block, count]) => ({ block, count }))
    .sort((a, b) => b.count - a.count);

  return {
    format: "litematic",
    width,
    height,
    length,
    totalBlocks,
    palette,
    blocks,
    materials,
  };
}
