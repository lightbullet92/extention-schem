import type { RgbColor } from "./types";

const rgb = (r: number, g: number, b: number): RgbColor => ({ r, g, b });

export function getBlockColor(blockId: string): RgbColor {
  const id = blockId.toLowerCase();
  if (id.includes("grass")) return rgb(95, 159, 53);
  if (id.includes("leaves") || id.includes("vine") || id.includes("moss")) return rgb(64, 130, 45);
  if (id.includes("water")) return rgb(45, 110, 215);
  if (id.includes("lava") || id.includes("magma")) return rgb(225, 95, 25);
  if (id.includes("sandstone")) return rgb(216, 203, 155);
  if (id.includes("sand")) return rgb(225, 215, 165);
  if (id.includes("dirt") || id.includes("podzol") || id.includes("mud")) return rgb(134, 96, 67);
  if (id.includes("spruce")) return rgb(92, 62, 36);
  if (id.includes("birch")) return rgb(205, 195, 145);
  if (id.includes("dark_oak")) return rgb(66, 43, 20);
  if (id.includes("acacia") || id.includes("copper")) return rgb(185, 102, 56);
  if (id.includes("jungle")) return rgb(155, 110, 72);
  if (id.includes("cherry")) return rgb(215, 155, 165);
  if (id.includes("oak") || id.includes("planks") || id.includes("log") || id.includes("wood")) return rgb(162, 130, 78);
  if (id.includes("deepslate") || id.includes("blackstone") || id.includes("obsidian") || id.includes("coal")) return rgb(55, 58, 66);
  if (id.includes("nether_brick") || id.includes("netherrack") || id.includes("crimson")) return rgb(115, 45, 52);
  if (id.includes("brick")) return rgb(156, 82, 68);
  if (id.includes("quartz") || id.includes("snow") || id.includes("white") || id.includes("calcite")) return rgb(232, 232, 232);
  if (id.includes("gold")) return rgb(235, 195, 52);
  if (id.includes("diamond") || id.includes("prismarine") || id.includes("warped")) return rgb(75, 195, 185);
  if (id.includes("emerald")) return rgb(55, 195, 95);
  if (id.includes("redstone") || id.includes("red_")) return rgb(175, 42, 38);
  if (id.includes("lapis") || id.includes("blue")) return rgb(48, 82, 175);
  if (id.includes("yellow")) return rgb(225, 200, 55);
  if (id.includes("green") || id.includes("lime")) return rgb(95, 165, 45);
  if (id.includes("purple") || id.includes("magenta") || id.includes("purpur")) return rgb(145, 75, 165);
  if (id.includes("glass") || id.includes("ice")) return rgb(175, 215, 235);
  if (id.includes("iron") || id.includes("andesite") || id.includes("diorite")) return rgb(175, 178, 182);
  if (id.includes("granite") || id.includes("terracotta")) return rgb(152, 98, 78);
  if (id.includes("glowstone") || id.includes("lantern") || id.includes("torch")) return rgb(240, 190, 85);
  if (id.includes("stone") || id.includes("cobble") || id.includes("gravel")) return rgb(128, 130, 134);

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return rgb(
    90 + (Math.abs(hash) % 110),
    90 + (Math.abs(hash >> 8) % 110),
    90 + (Math.abs(hash >> 16) % 110),
  );
}

export function shadeRgb(color: RgbColor, factor: number): string {
  const r = Math.min(255, Math.max(0, Math.round(color.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(color.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(color.b * factor)));
  return "rgb(" + r + "," + g + "," + b + ")";
}
