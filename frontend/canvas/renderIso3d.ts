import { getBlockColor, shadeRgb } from "../colors";
import type { InspectedSchematic } from "../types";

export function renderIsometric3d(
  ctx: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  schem: InspectedSchematic,
  rotation: number,
  zoom: number,
): void {
  const { width, height, length, blocks, palette } = schem;

  const getBlockAt = (x: number, y: number, z: number): number => {
    if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= length) return 0;
    return blocks[(y * length + z) * width + x] ?? 0;
  };

  const rot = ((rotation % 4) + 4) % 4;
  const rWidth = rot % 2 === 0 ? width : length;
  const rLength = rot % 2 === 0 ? length : width;

  const mapCoords = (x: number, z: number): [number, number] => {
    if (rot === 0) return [x, z];
    if (rot === 1) return [length - 1 - z, x];
    if (rot === 2) return [width - 1 - x, length - 1 - z];
    return [z, width - 1 - x];
  };

  const spanX = rWidth + rLength;
  const spanY = (rWidth + rLength) * 0.5 + height;
  const tileW = Math.max(2, Math.min((widthPx - 48) / spanX, (heightPx - 48) / spanY) * zoom);
  const tileH = tileW * 0.5;
  const blockH = tileW * 0.85;

  const originX = widthPx / 2 + ((rLength - rWidth) * tileW) / 2;
  const originY =
    (heightPx - ((rWidth + rLength) * tileH + height * blockH)) / 2 + height * blockH;

  for (let y = 0; y < height; y++) {
    for (let rx = 0; rx < rWidth; rx++) {
      for (let rz = 0; rz < rLength; rz++) {
        let ox = rx;
        let oz = rz;
        if (rot === 1) {
          ox = rz;
          oz = length - 1 - rx;
        } else if (rot === 2) {
          ox = width - 1 - rx;
          oz = length - 1 - rz;
        } else if (rot === 3) {
          ox = width - 1 - rz;
          oz = rx;
        }

        const bIdx = getBlockAt(ox, y, oz);
        if (bIdx === 0) continue;

        // Отсечение полностью закрытых внутренних блоков
        const isOccluded =
          y + 1 < height &&
          getBlockAt(ox, y + 1, oz) !== 0 &&
          ox > 0 &&
          ox < width - 1 &&
          oz > 0 &&
          oz < length - 1 &&
          getBlockAt(ox - 1, y, oz) !== 0 &&
          getBlockAt(ox + 1, y, oz) !== 0 &&
          getBlockAt(ox, y, oz - 1) !== 0 &&
          getBlockAt(ox, y, oz + 1) !== 0;

        if (isOccluded) continue;

        const [px, pz] = mapCoords(ox, oz);
        const sx = originX + (px - pz) * tileW;
        const sy = originY + (px + pz) * tileH - y * blockH;
        const color = getBlockColor(palette[bIdx] || "minecraft:stone");

        // Верхняя грань
        ctx.fillStyle = shadeRgb(color, 1.12);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + tileW, sy + tileH);
        ctx.lineTo(sx, sy + tileH * 2);
        ctx.lineTo(sx - tileW, sy + tileH);
        ctx.closePath();
        ctx.fill();

        // Левая грань
        ctx.fillStyle = shadeRgb(color, 0.85);
        ctx.beginPath();
        ctx.moveTo(sx - tileW, sy + tileH);
        ctx.lineTo(sx, sy + tileH * 2);
        ctx.lineTo(sx, sy + tileH * 2 + blockH);
        ctx.lineTo(sx - tileW, sy + tileH + blockH);
        ctx.closePath();
        ctx.fill();

        // Правая грань
        ctx.fillStyle = shadeRgb(color, 0.65);
        ctx.beginPath();
        ctx.moveTo(sx + tileW, sy + tileH);
        ctx.lineTo(sx, sy + tileH * 2);
        ctx.lineTo(sx, sy + tileH * 2 + blockH);
        ctx.lineTo(sx + tileW, sy + tileH + blockH);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}
