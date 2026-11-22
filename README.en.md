# Global Schematics & 3D Viewer — Kubek Extension

[Русская версия](README.md)

A **Kubek 4.1+** extension that unifies the schematics folder (`WorldEdit` and `FastAsyncWorldEdit`) across selected servers via symbolic links, supports chunked browser uploads (`.schem`, `.schematic`, `.litematic`), and includes a built-in 3D/layer-by-layer structure viewer with a resource calculator.

### Features

- **Automatic Plugin Detection** — scans all servers in Kubek and detects `FastAsyncWorldEdit` or `WorldEdit` (prioritizing FAWE when both are present).
- **Safe Symlink & Config Management** — replaces `plugins/<Plugin>/schematics` on selected servers with a symlink to `/data/global_schematics` and automatically enables `allow-symbolic-links: true` in plugin configs (`config.yml` / `worldedit-config.yml`). Existing files are migrated to the shared directory first; unchecking a server removes the symlink and restores a regular folder.
- **Chunked Browser Upload** — upload `.schem` (Sponge v2/v3), `.schematic` (MCEdit), and `.litematic` (Litematica) files to the root directory or a target subfolder (e.g. `1.20.1/`). Files are transferred in 64 KB chunks (bypassing reverse-proxy body limits) and validated by the NBT parser before saving.
- **Interactive 3D & Layer Viewer** — built-in HTML5 Canvas renderer with zero external dependencies and **RLE compression** over the network (loads 1M+ block structures almost instantly even on slow connections):
  - **3D Isometric View** with face shading, mouse rotation, zooming, and hidden interior block culling.
  - **Layer-by-Layer Slice (Y)** with a height slider and cursor hover tooltip (exact block ID and coordinates).
  - **Resource Calculator** — counts blocks of every type and converts totals into stacks (`stacks + items`).
- **Native UI & Localization** — runs on the `window.Kubek` runtime without bundling React and supports English and Russian (`locales/en.json` / `locales/ru.json`).

### Project Structure

```text
kubek-extension.json          extension manifest (capabilities, permissions, sidebar route)
backend/
  index.ts                    entry point activate(), RLE encoder, and HTTP routes
  symlinks.ts                 symlink management facade
  symlinks/
    types.ts                  path constants and server state interfaces
    detector.ts               server directory and FAWE / WorldEdit detector
    linker.ts                 file migration, allow-symbolic-links updater, and symlinking
  files.ts                    schematic file operations facade
  files/
    paths.ts                  extension validation (.schem, .schematic, .litematic) and safe paths
    scanner.ts                recursive scanner for global_schematics
    uploader.ts               chunked upload handler and pre-save NBT validation
  nbt.ts                      NBT parser facade
  nbt/
    types.ts                  NBT tag and parsed schematic interfaces
    reader.ts                 GZIP decompressor and binary NBT reader
    legacyIds.ts              numeric legacy block ID mapping (.schematic)
    builder.ts                palette builder, air filtering, and material counter
    sponge.ts                 VarInt decoder and Sponge parser (.schem v2/v3)
    mcedit.ts                 classic MCEdit format parser (.schematic)
    litematic.ts              Litematica region and bit-packed BlockStates parser (.litematic)
    parsers.ts                format dispatcher parseSchematicBuffer()
frontend/
  index.tsx                   root component with tab switcher and module exports
  types.ts                    shared TypeScript interfaces
  i18n.ts                     translation hook, fallback dictionary, and size/stack formatters
  colors.ts                   block color resolver and face shading engine
  colors/                     categorized JSON block palettes (exact, ores, woods, nature, lighting, stones, dyed)
  ServersTab.tsx              server selection tab for symlink management
  ViewerTab.tsx               viewer container, RLE decoder, file list and canvas coordinator
  SchematicFilesPanel.tsx     left sidebar container with file list and uploader
  files/                      chunked upload components (uploadChunked, SchematicUploader, SchematicList)
  ViewerControls.tsx          dimensions bar, 3D/layer toggle, rotation, zoom, and Y slider
  SchematicCanvas.tsx         HTML5 Canvas component handling rotation and hover inspection
  canvas/                     rendering engines (renderIso3d.ts, renderLayer.ts)
  MaterialsList.tsx           required blocks grid with stack calculation
  dist/                       compiled ESM bundle for the browser
build.ts                      transpiles frontend/index.tsx → frontend/dist/index.js via Bun.build
locales/                      i18n translation files (en.json / ru.json)
tsconfig.json                 TypeScript configuration
icon.png                      extension icon shown in Kubek
.vscode/tasks.json            universal VS Code build task (Ctrl + Shift + B)
```

### Build & Package

1. Install dependencies:
   ```sh
   bun install
   ```
2. Build the frontend and package the `.kubekext` archive (or press **`Ctrl + Shift + B`** in VS Code):
   ```sh
   bun run build.ts
   OUT=$(bun -e 'const m = require("./kubek-extension.json"); console.log(m.id.split(".").pop() + "-" + m.version + ".kubekext")')
   zip -r "$OUT" kubek-extension.json tsconfig.json backend frontend locales icon.png
   ```

### Installation & Setup

1. Open **Extensions** in your Kubek 4.1+ dashboard and upload `global-schematics-<version>.kubekext`.
2. Confirm the requested capabilities on the consent screen and enable the extension.
3. Grant `ext.schematics.view`, `ext.schematics.upload`, and `ext.schematics.manage` permissions to the required user roles.
4. Open **Schematics** in the sidebar:
   - In the **Servers & Symlinks** tab, select the servers to link to `/data/global_schematics`.
   - In the **Schematic Viewer** tab, upload new files (`.schem`, `.schematic`, `.litematic`), inspect structures in 3D or by layers, and delete unused schematics.

> **Docker Note:** If your game servers run in separate Docker containers, ensure the shared `global_schematics` directory is mounted into those containers at `/data/global_schematics` so symlinks resolve properly.

### Permissions

| Type | Key | Description |
| :--- | :--- | :--- |
| `requires` | `servers:read` | Read server list and plugin directory paths |
| `requires` | `http:routes` | Register `/api/ext/com.kubek.global-schematics/*` API routes |
| `declares` | `ext.schematics.view` | View server list, schematic files, and 3D/layer viewer |
| `declares` | `ext.schematics.upload` | Upload `.schem`, `.schematic`, and `.litematic` files via the web UI |
| `declares` | `ext.schematics.manage` | Manage server symlinks and delete schematic files |
