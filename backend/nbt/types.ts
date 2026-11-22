export type NbtValue =
  | number
  | bigint
  | string
  | Uint8Array
  | Int32Array
  | BigInt64Array
  | NbtValue[]
  | NbtCompound;

export interface NbtCompound {
  [key: string]: NbtValue;
}

export interface ParsedSchematic {
  format: "sponge" | "mcedit" | "litematic";
  width: number;
  height: number;
  length: number;
  totalBlocks: number;
  palette: string[];
  blocks: number[];
  materials: Array<{ block: string; count: number }>;
}
