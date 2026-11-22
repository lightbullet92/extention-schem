import path from "node:path";

const KUBEK_ROOT = process.cwd();
export const GLOBAL_SCHEMATICS_DIR = path.join(KUBEK_ROOT, "data", "global_schematics");

export interface DetectedPlugin {
  plugin: "FastAsyncWorldEdit" | "WorldEdit";
  schematicsPath: string;
}

export interface ServerSymlinkState {
  id: string;
  name: string;
  status: string;
  plugin: "FastAsyncWorldEdit" | "WorldEdit";
  schematicsPath: string;
  linked: boolean;
}
