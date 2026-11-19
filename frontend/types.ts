export interface ServerItem {
  id: string;
  name: string;
  plugin: "FastAsyncWorldEdit" | "WorldEdit";
  schematicsPath: string;
  isLinked: boolean;
}

export interface ServersResponse {
  globalDir: string;
  servers: ServerItem[];
}

export interface SchematicFileInfo {
  name: string;
  size: number;
  updatedAt: number;
}

export interface InspectedSchematic {
  name: string;
  format: "sponge" | "mcedit";
  width: number;
  height: number;
  length: number;
  totalBlocks: number;
  palette: string[];
  blocks: number[];
  materials: Array<{ block: string; count: number }>;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}
