import { getBlockColor, shadeRgb } from "../colors";
import type { InspectedSchematic } from "../types";

export function renderLayerSlice(
  ctx: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  schem: InspectedSchematic,
  layerY: number,
  zoom: number,
): void {
  const { width, height, length, blocks, palette } = schem;
  if (layerY < 0 || layerY >= height) return;

  const cellSize = Math.max(
    4,
    Math.min((widthPx - 40) / width, (heightPx - 40) / length) * zoom,
  );
  const offsetX = (widthPx - width * cellSize) / 2;
  const offsetY = (heightPx - length * cellSize) / 2;

  ctx.strokeStyle = "rgba(128, 128, 128, 0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX, offsetY, width * cellSize, length * cellSize);

  for (let z = 0; z < length; z++) {
    for (let x = 0; x < width; x++) {
      const bIdx = blocks[(layerY * length + z) * width + x] ?? 0;
      if (bIdx === 0) continue;

      const color = getBlockColor(palette[bIdx] || "minecraft:stone");
      ctx.fillStyle = shadeRgb(color, 1.0);
      ctx.fillRect(
        offsetX + x * cellSize,
        offsetY + z * cellSize,
        cellSize - 0.5,
        cellSize - 0.5,
      );
    }
  }
}

export function getHoveredLayerBlock(
  mx: number,
  my: number,
  canvasWidth: number,
  canvasHeight: number,
  schem: InspectedSchematic,
  layerY: number,
  zoom: number,
  airLabel: string,
): string | null {
  const cellSize = Math.max(
    4,
    Math.min((canvasWidth - 40) / schem.width, (canvasHeight - 40) / schem.length) * zoom,
  );
  const offsetX = (canvasWidth - schem.width * cellSize) / 2;
  const offsetY = (canvasHeight - schem.length * cellSize) / 2;
  const bx = Math.floor((mx - offsetX) / cellSize);
  const bz = Math.floor((my - offsetY) / cellSize);

  if (bx < 0 || bx >= schem.width || bz < 0 || bz >= schem.length) {
    return null;
  }

  const idx = schem.blocks[(layerY * schem.length + bz) * schem.width + bx] ?? 0;
  const label = idx === 0 ? airLabel : schem.palette[idx] || "unknown";
  return label + " (" + bx + ", " + layerY + ", " + bz + ")";
}
