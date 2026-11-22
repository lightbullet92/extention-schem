export const EXT_ID = "com.kubek.global-schematics";

const FALLBACK_RU: Record<string, string> = {
  "globalSchematics.tab.servers": "Серверы и симлинки",
  "globalSchematics.tab.viewer": "Просмотрщик схематиков",
  "globalSchematics.page.title": "Общие схематики (WorldEdit / FAWE)",
  "globalSchematics.page.sharedDir": "Общая директория:",
  "globalSchematics.page.loading": "Поиск серверов с WorldEdit / FastAsyncWorldEdit...",
  "globalSchematics.page.empty": "Не найдено ни одного сервера с установленным WorldEdit или FAWE.",
  "globalSchematics.action.save": "Сохранить и создать симлинки",
  "globalSchematics.action.saving": "Применение...",
  "globalSchematics.action.refresh": "Обновить список",
  "globalSchematics.status.saved": "Симлинки успешно обновлены!",
  "globalSchematics.status.loadError": "Ошибка загрузки",
  "globalSchematics.status.saveError": "Ошибка сохранения",
  "globalSchematics.viewer.folderPlaceholder": "Подпапка (напр. 1.20.1 или пусто)",
  "globalSchematics.viewer.upload": "+ Загрузить схематик",
  "globalSchematics.viewer.uploading": "Загрузка...",
  "globalSchematics.viewer.files": "Файлы",
  "globalSchematics.viewer.refresh": "Обновить",
  "globalSchematics.viewer.loadingList": "Загрузка...",
  "globalSchematics.viewer.emptyFiles": "В папке global_schematics пока нет файлов .schem, .schematic или .litematic",
  "globalSchematics.viewer.deleteConfirm": "Удалить файл из общей папки?",
  "globalSchematics.viewer.deleteTitle": "Удалить файл",
  "globalSchematics.viewer.parsing": "Разбор структуры схематика...",
  "globalSchematics.viewer.selectPrompt": "Выберите файл схематика слева для 3D-просмотра и подсчёта блоков",
  "globalSchematics.viewer.dimensions": "Размеры (Ш×В×Д):",
  "globalSchematics.viewer.blocksCount": "Блоков:",
  "globalSchematics.viewer.mode3d": "3D Изометрия",
  "globalSchematics.viewer.modeLayer": "По слоям (Y)",
  "globalSchematics.viewer.rotate": "↻ Повернуть",
  "globalSchematics.viewer.layerLabel": "Слой Y:",
  "globalSchematics.viewer.air": "Воздух",
  "globalSchematics.viewer.materialsTitle": "Необходимые блоки",
  "globalSchematics.viewer.materialsTypes": "видов",
  "globalSchematics.unit.bytes": "Б",
  "globalSchematics.unit.kb": "КБ",
  "globalSchematics.unit.mb": "МБ",
  "globalSchematics.unit.pcs": "шт.",
  "globalSchematics.unit.stacks": "ст.",
};

export function useExtTranslation() {
  const kubekT = window.Kubek?.hooks?.useTranslation?.().t;

  const isValid = (res: string | undefined, key: string): res is string =>
    Boolean(res && res !== key && !res.startsWith("NOT TRANSLATED"));

  return (key: string): string => {
    const fullKey = key.startsWith("globalSchematics.")
      ? key
      : "globalSchematics." + key;

    if (kubekT) {
      const res = kubekT(fullKey);
      if (isValid(res, fullKey)) return res;
    }
    return FALLBACK_RU[fullKey] ?? FALLBACK_RU[key] ?? key;
  };
}

export function formatSize(bytes: number, tr: (k: string) => string): string {
  if (bytes < 1024) return bytes + " " + tr("unit.bytes");
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " " + tr("unit.kb");
  return (bytes / (1024 * 1024)).toFixed(2) + " " + tr("unit.mb");
}

export function formatStacks(count: number, tr: (k: string) => string): string {
  if (count < 64) return count + " " + tr("unit.pcs");
  const stacks = Math.floor(count / 64);
  const rem = count % 64;
  return rem > 0
    ? stacks + " " + tr("unit.stacks") + " + " + rem + " " + tr("unit.pcs")
    : stacks + " " + tr("unit.stacks");
}
