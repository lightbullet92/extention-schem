# Global Schematics & 3D Viewer — Kubek Extension

A **Kubek 4.1+** extension that shares WorldEdit and FastAsyncWorldEdit (FAWE) schematics across multiple Minecraft servers via symbolic links, provides chunked browser uploads, and includes a built-in 3D/layer schematic viewer with material calculation.

_Расширение для **Kubek 4.1+**, которое объединяет папку схематиков (WorldEdit и FastAsyncWorldEdit) между выбранными серверами через символические ссылки, поддерживает чанковую загрузку файлов из браузера и включает встроенный 3D/послойный просмотрщик построек с подсчётом ресурсов._

---

## English

### Features

- **Automatic Plugin Detection** — scans all Kubek servers and detects installed `FastAsyncWorldEdit` or `WorldEdit` plugins (prioritizing FAWE if both are present).
- **Safe Symlink Synchronization** — replaces each selected server's `plugins/<Plugin>/schematics` folder with a symlink pointing to `/data/global_schematics`. Existing schematics are migrated safely before linking; unchecking a server removes the symlink and restores a regular directory.
- **Chunked Browser Upload** — upload `.schem` (Sponge v2/v3) and `.schematic` (MCEdit) files directly from the web UI into the root or any subfolder (e.g. `1.20.1/`). Files are split into 64 KB chunks to bypass reverse-proxy/JSON body limits and validated against NBT structure before saving.
- **Interactive 3D & Layer Viewer** — built-in HTML5 Canvas renderer supporting:
  - **3D Isometric View** with face shading, mouse-drag rotation, zoom controls, and occlusion culling for large builds (1M+ blocks).
  - **Layer-by-Layer Slice (Y)** with a height slider and hover tooltips showing exact block IDs and coordinates.
  - **Material Calculator** — counts all blocks in the schematic and converts quantities into Minecraft stacks (`st. + pcs`).
- **Native UI & Full Localization** — uses the `window.Kubek` runtime without bundling React and supports English and Russian (`locales/en.json` / `locales/ru.json`).

### Project Structure

```text
kubek-extension.json          extension manifest (capabilities, permissions, sidebar route)
backend/
  index.ts                    entry point activate() and HTTP route registration
  symlinks.ts                 FAWE/WorldEdit detection, file migration, symlink creation/removal
  files.ts                    recursive schematic scanner, safe path resolver, chunked upload handler
  nbt.ts                      GZIP decompressor & binary NBT parser for .schem and .schematic
frontend/
  index.tsx                   root component with tab switcher and KubekFrontendModule export
  types.ts                    shared TypeScript interfaces
  i18n.ts                     translation hook, fallback dictionary, and size/stack formatters
  colors.ts                   Minecraft block color palette and face shading utilities
  ServersTab.tsx              server checklist UI for managing schematic symlinks
  ViewerTab.tsx               viewer layout container coordinating files, canvas, and materials
  SchematicFilesPanel.tsx     chunked file uploader, schematic list, and deletion controls
  ViewerControls.tsx          dimensions header, 3D/layer toggle, rotation, zoom, and Y-slider
  SchematicCanvas.tsx         HTML5 Canvas 3D isometric and 2D layer renderer
  MaterialsList.tsx           required blocks grid with stack calculation
  dist/                       compiled ESM bundle served to the browser
build.ts                      transpiles frontend/index.tsx → frontend/dist/index.js via Bun.build
locales/                      i18n translation files (en.json / ru.json)
tsconfig.json                 TypeScript configuration
icon.png                      extension icon shown in Kubek
.vscode/tasks.json            universal VS Code build task (Ctrl + Shift + B) using manifest id & version
```

### Build & Package

1. Install dependencies:
   ```sh
   bun install
   ```
2. Build and package the `.kubekext` archive (or press **`Ctrl + Shift + B`** in VS Code):
   ```sh
   bun run build.ts
   OUT=\$(bun -e 'const m = require("./kubek-extension.json"); console.log(m.id.split(".").pop() + "-" + m.version + ".kubekext")')
   zip -r "\$OUT" kubek-extension.json tsconfig.json backend frontend locales icon.png
   ```

### Installation & Setup

1. Open **Extensions** in your Kubek 4.1+ dashboard and upload `global-schematics-<version>.kubekext`.
2. Confirm the requested capabilities on the consent screen and enable the extension.
3. Grant `ext.schematics.view`, `ext.schematics.upload`, and `ext.schematics.manage` permissions to the appropriate user roles.
4. Open **Schematics** in the sidebar:
   - Use **Servers & Symlinks** to link your Minecraft servers to `/data/global_schematics`.
   - Use **Schematic Viewer** to upload, inspect in 3D, slice by Y-layer, or delete schematic files.

> **Docker Note:** If game servers run in separate Docker containers, ensure the host `global_schematics` directory is mounted at `/data/global_schematics` inside those containers so symlinks resolve properly.

### Permissions

| Type | Key | Description |
| :--- | :--- | :--- |
| `requires` | `servers:read` | Read the server list and resolve plugin directories |
| `requires` | `http:routes` | Expose `/api/ext/com.kubek.global-schematics/*` endpoints |
| `declares` | `ext.schematics.view` | View linked servers, schematic file list, and 3D/layer preview |
| `declares` | `ext.schematics.upload` | Upload `.schem` and `.schematic` files via the web interface |
| `declares` | `ext.schematics.manage` | Create/remove server symlinks and delete schematic files |

---

## Русский

### Возможности

- **Автоматический поиск плагинов** — сканирует все серверы в Kubek и определяет наличие `FastAsyncWorldEdit` или `WorldEdit` (при наличии обоих приоритет отдаётся FAWE).
- **Безопасное управление симлинками** — заменяет папку `plugins/<Плагин>/schematics` выбранных серверов на символическую ссылку в `/data/global_schematics`. Существующие файлы предварительно переносятся в общую директорию; при снятии галочки симлинк удаляется и возвращается обычная папка.
- **Чанковая загрузка из браузера** — загрузка файлов `.schem` (Sponge v2/v3) и `.schematic` (MCEdit) в корень общей папки или в выбранную подпапку (например, `1.20.1/`). Файлы передаются частями по 64 КБ (обходя лимиты размера JSON-запроса) и проверяются NBT-парсером перед сохранением.
- **Интерактивный 3D и послойный просмотрщик** — встроенный рендер на HTML5 Canvas без внешних зависимостей:
  - **3D Изометрия** с затенением граней, вращением мышкой, масштабированием и отсечением невидимых внутренних блоков (поддерживает крупные постройки на 1+ млн блоков).
  - **Послойный срез (Y)** с ползунком высоты и подсказкой при наведении курсора (точный ID блока и координаты).
  - **Калькулятор ресурсов** — подсчитывает количество блоков каждого типа и переводит их в стаки (`ст. + шт.`).
- **Нативный интерфейс и локализация** — использует рантайм `window.Kubek` без дублирования React и полностью переведён на русский и английский языки (`locales/ru.json` / `locales/en.json`).

### Структура проекта

```text
kubek-extension.json          манифест расширения (права доступа, capabilities, пункт меню)
backend/
  index.ts                    точка входа activate() и регистрация HTTP-маршрутов
  symlinks.ts                 поиск FAWE/WorldEdit, перенос файлов, создание и удаление симлинков
  files.ts                    рекурсивный поиск схематиков, безопасные пути, чанковая загрузка
  nbt.ts                      распаковщик GZIP и бинарный парсер NBT для .schem и .schematic
frontend/
  index.tsx                   корневой компонент с переключателем вкладок и экспортом модуля
  types.ts                    общие интерфейсы TypeScript
  i18n.ts                     хук локализации, резервный словарь и форматирование размеров/стаков
  colors.ts                   палитра цветов блоков Minecraft и затенение граней
  ServersTab.tsx              вкладка выбора серверов для создания симлинков
  ViewerTab.tsx               контейнер просмотрщика, связывающий список файлов, холст и материалы
  SchematicFilesPanel.tsx     загрузка файлов по чанкам, список схематиков и удаление
  ViewerControls.tsx          панель размеров, переключение 3D/слои, поворот, масштаб и ползунок Y
  SchematicCanvas.tsx         рендер 3D-изометрии и 2D-слоёв на HTML5 Canvas
  MaterialsList.tsx           сетка необходимых блоков с расчётом количества в стаках
  dist/                       собранный ESM-бандл для браузера
build.ts                      сборка frontend/index.tsx → frontend/dist/index.js через Bun.build
locales/                      файлы локализации (ru.json / en.json)
tsconfig.json                 конфигурация TypeScript
icon.png                      иконка расширения в списке панели
.vscode/tasks.json            универсальная задача сборки в VS Code (Ctrl + Shift + B)
```

### Сборка и упаковка

1. Установите зависимости:
   ```sh
   bun install
   ```
2. Соберите фронтенд и упакуйте архив `.kubekext` (либо нажмите **`Ctrl + Shift + B`** в VS Code):
   ```sh
   bun run build.ts
   OUT=\$(bun -e 'const m = require("./kubek-extension.json"); console.log(m.id.split(".").pop() + "-" + m.version + ".kubekext")')
   zip -r "\$OUT" kubek-extension.json tsconfig.json backend frontend locales icon.png
   ```

### Установка и использование

1. Перейдите в раздел **Расширения** в панели Kubek 4.1+ и загрузите файл `global-schematics-<версия>.kubekext`.
2. Нажмите **«Сохранить согласие»** для подтверждения прав доступа и включите расширение переключателем.
3. Выдайте права `ext.schematics.view`, `ext.schematics.upload` и `ext.schematics.manage` нужным ролям пользователей.
4. Откройте пункт **Схематики** в левом меню:
   - Во вкладке **«Серверы и симлинки»** отметьте серверы для подключения к `/data/global_schematics`.
   - Во вкладке **«Просмотрщик схематиков»** загружайте новые файлы, просматривайте постройки в 3D или по слоям и удаляйте ненужные схематики.

> **Примечание для Docker:** Если игровые серверы запускаются в отдельных Docker-контейнерах, убедитесь, что общая директория `global_schematics` проброшена в эти контейнеры по пути `/data/global_schematics`, чтобы символические ссылки корректно разрешались.

### Права доступа

| Тип | Ключ | Описание |
| :--- | :--- | :--- |
| `requires` | `servers:read` | Получение списка серверов и путей к папкам плагинов |
| `requires` | `http:routes` | Регистрация API-маршрутов `/api/ext/com.kubek.global-schematics/*` |
| `declares` | `ext.schematics.view` | Просмотр списка серверов, файлов схематиков и 3D/послойного рендера |
| `declares` | `ext.schematics.upload` | Загрузка файлов `.schem` и `.schematic` через веб-интерфейс |
| `declares` | `ext.schematics.manage` | Управление симлинками серверов и удаление файлов схематиков |
