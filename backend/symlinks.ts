export {
  detectSchematicPlugin,
  detectSchematicPlugin as detectSchematicsTarget,
  resolveServerDir,
} from "./symlinks/detector";
export {
  ensureGlobalDir,
  isLinkedToGlobal,
  isLinkedToGlobal as isSymlinkLinkedToGlobal,
  linkServerSchematics,
  linkServerSchematics as linkServerToGlobal,
  unlinkServerSchematics,
  unlinkServerSchematics as unlinkServerFromGlobal,
} from "./symlinks/linker";
export {
  GLOBAL_SCHEMATICS_DIR,
  type DetectedPlugin,
  type ServerSymlinkState,
} from "./symlinks/types";
