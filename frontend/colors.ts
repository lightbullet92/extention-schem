import dyedRules from "./colors/dyed.json";
import exactColors from "./colors/exact.json";
import lightingRules from "./colors/lighting.json";
import natureRules from "./colors/nature.json";
import oreRules from "./colors/ores.json";
import stoneRules from "./colors/stones.json";
import woodRules from "./colors/woods.json";
import type { RgbColor } from "./types";

interface ColorRule {
  match: string[];
  rgb: RgbColor;
}

const EXACT_MAP = exactColors as Record<string, RgbColor>;

const ALL_RULES: ColorRule[] = [
  ...(oreRules as ColorRule[]),
  ...(woodRules as ColorRule[]),
  ...(natureRules as ColorRule[]),
  ...(lightingRules as ColorRule[]),
  ...(stoneRules as ColorRule[]),
  ...(dyedRules as ColorRule[]),
];

export function getBlockColor(blockId: string): RgbColor {
  const id = blockId.toLowerCase();
  const normalizedId = id.startsWith("minecraft:") ? id : "minecraft:" + id;

  const exact = EXACT_MAP[normalizedId];
  if (exact) return exact;

  for (const rule of ALL_RULES) {
    if (rule.match.some((kw) => id.includes(kw))) {
      return rule.rgb;
    }
  }

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return {
    r: 90 + (Math.abs(hash) % 110),
    g: 90 + (Math.abs(hash >> 8) % 110),
    b: 90 + (Math.abs(hash >> 16) % 110),
  };
}

export function shadeRgb(color: RgbColor, factor: number): string {
  const r = Math.min(255, Math.max(0, Math.round(color.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(color.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(color.b * factor)));
  return "rgb(" + r + "," + g + "," + b + ")";
}
