export interface ParsedSchematic {
    format: "sponge" | "mcedit";
    width: number;
    height: number;
    length: number;
    totalBlocks: number;
    palette: string[]; // индекс -> ID блока (0 всегда "minecraft:air")
    // Плоский массив индексов палитры размером width * height * length
    // Порядок: (y * length + z) * width + x
    blocks: number[];
    materials: Array<{ block: string; count: number }>;
}

class NbtReader {
    private view: DataView;
    private bytes: Uint8Array;
    private offset = 0;

    constructor(buffer: Uint8Array) {
        this.bytes = buffer;
        this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }

    readByte(): number {
        const v = this.view.getInt8(this.offset);
        this.offset += 1;
        return v;
    }

    readUByte(): number {
        const v = this.view.getUint8(this.offset);
        this.offset += 1;
        return v;
    }

    readShort(): number {
        const v = this.view.getInt16(this.offset, false);
        this.offset += 2;
        return v;
    }

    readInt(): number {
        const v = this.view.getInt32(this.offset, false);
        this.offset += 4;
        return v;
    }

    readLong(): bigint {
        const v = this.view.getBigInt64(this.offset, false);
        this.offset += 8;
        return v;
    }

    readFloat(): number {
        const v = this.view.getFloat32(this.offset, false);
        this.offset += 4;
        return v;
    }

    readDouble(): number {
        const v = this.view.getFloat64(this.offset, false);
        this.offset += 8;
        return v;
    }

    readString(): string {
        const len = this.view.getUint16(this.offset, false);
        this.offset += 2;
        const slice = this.bytes.subarray(this.offset, this.offset + len);
        this.offset += len;
        return new TextDecoder("utf-8").decode(slice);
    }

    readTagPayload(tagType: number): unknown {
        switch (tagType) {
            case 1:
                return this.readByte();
            case 2:
                return this.readShort();
            case 3:
                return this.readInt();
            case 4:
                return this.readLong();
            case 5:
                return this.readFloat();
            case 6:
                return this.readDouble();
            case 7: {
                const len = this.readInt();
                const arr = new Int8Array(len);
                for (let i = 0; i < len; i++) arr[i] = this.readByte();
                return arr;
            }
            case 8:
                return this.readString();
            case 9: {
                const elemType = this.readUByte();
                const len = this.readInt();
                const list: unknown[] = [];
                for (let i = 0; i < len; i++) {
                    list.push(this.readTagPayload(elemType));
                }
                return list;
            }
            case 10: {
                const obj: Record<string, unknown> = {};
                while (true) {
                    const nextType = this.readUByte();
                    if (nextType === 0) break;
                    const name = this.readString();
                    obj[name] = this.readTagPayload(nextType);
                }
                return obj;
            }
            case 11: {
                const len = this.readInt();
                const arr = new Int32Array(len);
                for (let i = 0; i < len; i++) arr[i] = this.readInt();
                return arr;
            }
            case 12: {
                const len = this.readInt();
                const arr: bigint[] = [];
                for (let i = 0; i < len; i++) arr.push(this.readLong());
                return arr;
            }
            default:
                throw new Error("Неизвестный NBT-тег: " + tagType);
        }
    }

    parseRoot(): Record<string, unknown> {
        const rootType = this.readUByte();
        if (rootType !== 10) {
            throw new Error("Корневой тег NBT не является Compound");
        }
        this.readString(); // имя корневого тега
        return this.readTagPayload(10) as Record<string, unknown>;
    }
}

const LEGACY_IDS: Record<number, string> = {
    1: "minecraft:stone",
    2: "minecraft:grass_block",
    3: "minecraft:dirt",
    4: "minecraft:cobblestone",
    5: "minecraft:oak_planks",
    7: "minecraft:bedrock",
    8: "minecraft:water",
    9: "minecraft:water",
    10: "minecraft:lava",
    11: "minecraft:lava",
    12: "minecraft:sand",
    13: "minecraft:gravel",
    14: "minecraft:gold_ore",
    15: "minecraft:iron_ore",
    16: "minecraft:coal_ore",
    17: "minecraft:oak_log",
    18: "minecraft:oak_leaves",
    20: "minecraft:glass",
    24: "minecraft:sandstone",
    35: "minecraft:white_wool",
    41: "minecraft:gold_block",
    42: "minecraft:iron_block",
    43: "minecraft:smooth_stone_slab",
    44: "minecraft:smooth_stone_slab",
    45: "minecraft:bricks",
    46: "minecraft:tnt",
    47: "minecraft:bookshelf",
    48: "minecraft:mossy_cobblestone",
    49: "minecraft:obsidian",
    50: "minecraft:torch",
    53: "minecraft:oak_stairs",
    54: "minecraft:chest",
    56: "minecraft:diamond_ore",
    57: "minecraft:diamond_block",
    58: "minecraft:crafting_table",
    61: "minecraft:furnace",
    65: "minecraft:ladder",
    67: "minecraft:cobblestone_stairs",
    79: "minecraft:ice",
    80: "minecraft:snow_block",
    82: "minecraft:clay",
    85: "minecraft:oak_fence",
    87: "minecraft:netherrack",
    88: "minecraft:soul_sand",
    89: "minecraft:glowstone",
    95: "minecraft:white_stained_glass",
    98: "minecraft:stone_bricks",
    102: "minecraft:glass_pane",
    108: "minecraft:brick_stairs",
    109: "minecraft:stone_brick_stairs",
    112: "minecraft:nether_bricks",
    121: "minecraft:end_stone",
    133: "minecraft:emerald_block",
    152: "minecraft:redstone_block",
    155: "minecraft:quartz_block",
    159: "minecraft:white_terracotta",
    162: "minecraft:acacia_log",
    168: "minecraft:prismarine",
    169: "minecraft:sea_lantern",
    170: "minecraft:hay_block",
    172: "minecraft:terracotta",
    173: "minecraft:coal_block",
    174: "minecraft:packed_ice",
    201: "minecraft:purpur_block",
    206: "minecraft:end_stone_bricks",
    251: "minecraft:white_concrete",
};

function isAirBlock(blockId: string): boolean {
  const clean = blockId.split("[").at(0) || "";
  return (
    clean === "minecraft:air" ||
    clean === "minecraft:cave_air" ||
    clean === "minecraft:void_air" ||
    clean === "air"
  );
}

function cleanBlockName(raw: string): string {
  const base = raw.split("[").at(0) || raw;
  return base.includes(":") ? base : "minecraft:" + base;
}

export function parseSchematicBuffer(rawBytes: Uint8Array): ParsedSchematic {
  const decompressed =
    rawBytes.length >= 2 && rawBytes.at(0) === 0x1f && rawBytes.at(1) === 0x8b
      ? Bun.gunzipSync(new Uint8Array(rawBytes))
      : rawBytes;


    const reader = new NbtReader(decompressed);
    const root = reader.parseRoot();

    // Sponge Schematic v3 хранит данные внутри вложенного тега "Schematic"
    const schem =
        root.Schematic && typeof root.Schematic === "object"
            ? (root.Schematic as Record<string, unknown>)
            : root;

    const width = Number(schem.Width ?? 0);
    const height = Number(schem.Height ?? 0);
    const length = Number(schem.Length ?? 0);

    if (width <= 0 || height <= 0 || length <= 0) {
        throw new Error("Некорректные размеры схематика");
    }

    const volume = width * height * length;
    const blocks = new Array(volume).fill(0) as number[];
    const palette: string[] = ["minecraft:air"];
    const paletteToIndex = new Map<string, number>([["minecraft:air", 0]]);
    const counts = new Map<string, number>();

    const getPaletteIndex = (rawId: string): number => {
        const clean = cleanBlockName(rawId);
        if (isAirBlock(clean)) return 0;

        let idx = paletteToIndex.get(clean);
        if (idx === undefined) {
            idx = palette.length;
            palette.push(clean);
            paletteToIndex.set(clean, idx);
        }
        counts.set(clean, (counts.get(clean) ?? 0) + 1);
        return idx;
    };

    // Проверяем формат: Sponge (.schem) или MCEdit (.schematic)
    const blocksContainer =
        schem.Blocks && typeof schem.Blocks === "object" && !ArrayBuffer.isView(schem.Blocks)
            ? (schem.Blocks as Record<string, unknown>)
            : schem;

    const rawPalette = blocksContainer.Palette as Record<string, number> | undefined;
    const rawBlockData = (blocksContainer.BlockData ?? blocksContainer.Data) as
        | Int8Array
        | undefined;

    if (rawPalette && rawBlockData) {
        // Sponge v2 / v3 (.schem)
        const idMap = new Map<number, string>();
        for (const [blockName, rawId] of Object.entries(rawPalette)) {
            idMap.set(Number(rawId), blockName);
        }

        const uBytes = new Uint8Array(
            rawBlockData.buffer,
            rawBlockData.byteOffset,
            rawBlockData.byteLength,
        );
        let ptr = 0;
        let voxelIdx = 0;

        while (ptr < uBytes.length && voxelIdx < volume) {
            let value = 0;
            let shift = 0;
            while (ptr < uBytes.length) {
                const b = uBytes[ptr++]!;
                value |= (b & 0x7f) << shift;
                if ((b & 0x80) === 0) break;
                shift += 7;
            }
            const blockName = idMap.get(value) ?? "minecraft:air";
            blocks[voxelIdx] = getPaletteIndex(blockName);
            voxelIdx++;
        }

        const materials = Array.from(counts.entries())
            .map(([block, count]) => ({ block, count }))
            .sort((a, b) => b.count - a.count);

        const totalBlocks = materials.reduce((sum, m) => sum + m.count, 0);

        return {
            format: "sponge",
            width,
            height,
            length,
            totalBlocks,
            palette,
            blocks,
            materials,
        };
    }

    if (schem.Blocks && ArrayBuffer.isView(schem.Blocks)) {
        // Классический MCEdit (.schematic)
        const legacyBlocks = schem.Blocks as Int8Array;
        const uBlocks = new Uint8Array(
            legacyBlocks.buffer,
            legacyBlocks.byteOffset,
            legacyBlocks.byteLength,
        );

        const countLimit = Math.min(volume, uBlocks.length);
        for (let i = 0; i < countLimit; i++) {
            const numId = uBlocks[i]!;
            if (numId === 0) continue;
            const blockName = LEGACY_IDS[numId] ?? "minecraft:stone";
            blocks[i] = getPaletteIndex(blockName);
        }

        const materials = Array.from(counts.entries())
            .map(([block, count]) => ({ block, count }))
            .sort((a, b) => b.count - a.count);

        const totalBlocks = materials.reduce((sum, m) => sum + m.count, 0);

        return {
            format: "mcedit",
            width,
            height,
            length,
            totalBlocks,
            palette,
            blocks,
            materials,
        };
    }
    throw new Error("Неподдерживаемая структура файла схематика");
}