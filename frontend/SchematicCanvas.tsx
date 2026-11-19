import { getBlockColor, shadeRgb } from "./colors";
import type { InspectedSchematic } from "./types";

interface CanvasProps {
  schem: InspectedSchematic;
  viewMode: "3d" | "layer";
  rotation: number;
  zoom: number;
  layerY: number;
  onRotateStep: (delta: number) => void;
  tr: (k: string) => string;
}

export function SchematicCanvas({
  schem,
  viewMode,
  rotation,
  zoom,
  layerY,
  onRotateStep,
  tr,
}: CanvasProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useEffect, useRef, useState } = React;

  const [hoveredBlock, setHoveredBlock] = useState(null as string | null);
  const canvasRef = useRef(null as HTMLCanvasElement | null);
  const dragStartX = useRef(null as number | null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const { width, height, length, blocks, palette } = schem;
    const getBlockAt = (x: number, y: number, z: number): number => {
      if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= length) return 0;
      return blocks[(y * length + z) * width + x] ?? 0;
    };

    if (viewMode === "layer") {
      const cellSize = Math.max(4, Math.min((W - 40) / width, (H - 40) / length) * zoom);
      const offsetX = (W - width * cellSize) / 2;
      const offsetY = (H - length * cellSize) / 2;

      ctx.strokeStyle = "rgba(128, 128, 128, 0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(offsetX, offsetY, width * cellSize, length * cellSize);

      for (let z = 0; z < length; z++) {
        for (let x = 0; x < width; x++) {
          const bIdx = getBlockAt(x, layerY, z);
          if (bIdx === 0) continue;
          const color = getBlockColor(palette[bIdx] || "minecraft:stone");
          ctx.fillStyle = shadeRgb(color, 1.0);
          ctx.fillRect(offsetX + x * cellSize, offsetY + z * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
      return;
    }

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
    const tileW = Math.max(2, Math.min((W - 48) / spanX, (H - 48) / spanY) * zoom);
    const tileH = tileW * 0.5;
    const blockH = tileW * 0.85;

    const originX = W / 2 + ((rLength - rWidth) * tileW) / 2;
    const originY = (H - ((rWidth + rLength) * tileH + height * blockH)) / 2 + height * blockH;

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

          const hasTop = y + 1 < height && getBlockAt(ox, y + 1, oz) !== 0;
          if (
            hasTop &&
            ox > 0 && ox < width - 1 &&
            oz > 0 && oz < length - 1 &&
            getBlockAt(ox - 1, y, oz) !== 0 &&
            getBlockAt(ox + 1, y, oz) !== 0 &&
            getBlockAt(ox, y, oz - 1) !== 0 &&
            getBlockAt(ox, y, oz + 1) !== 0
          ) {
            continue;
          }

          const [px, pz] = mapCoords(ox, oz);
          const sx = originX + (px - pz) * tileW;
          const sy = originY + (px + pz) * tileH - y * blockH;
          const color = getBlockColor(palette[bIdx] || "minecraft:stone");

          ctx.fillStyle = shadeRgb(color, 1.12);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + tileW, sy + tileH);
          ctx.lineTo(sx, sy + tileH * 2);
          ctx.lineTo(sx - tileW, sy + tileH);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = shadeRgb(color, 0.85);
          ctx.beginPath();
          ctx.moveTo(sx - tileW, sy + tileH);
          ctx.lineTo(sx, sy + tileH * 2);
          ctx.lineTo(sx, sy + tileH * 2 + blockH);
          ctx.lineTo(sx - tileW, sy + tileH + blockH);
          ctx.closePath();
          ctx.fill();

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
  }, [schem, viewMode, rotation, zoom, layerY]);

  const handleMouseMove = (e: {
    clientX: number;
    clientY: number;
    currentTarget: HTMLCanvasElement;
  }) => {
    if (dragStartX.current !== null && viewMode === "3d") {
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > 45) {
        onRotateStep(dx > 0 ? 1 : -1);
        dragStartX.current = e.clientX;
      }
      return;
    }

    if (viewMode === "layer") {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
      const my = ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
      const cellSize = Math.max(
        4,
        Math.min(
          (e.currentTarget.width - 40) / schem.width,
          (e.currentTarget.height - 40) / schem.length,
        ) * zoom,
      );
      const offsetX = (e.currentTarget.width - schem.width * cellSize) / 2;
      const offsetY = (e.currentTarget.height - schem.length * cellSize) / 2;
      const bx = Math.floor((mx - offsetX) / cellSize);
      const bz = Math.floor((my - offsetY) / cellSize);

      if (bx >= 0 && bx < schem.width && bz >= 0 && bz < schem.length) {
        const idx = schem.blocks[(layerY * schem.length + bz) * schem.width + bx] ?? 0;
        const label = idx === 0 ? tr("viewer.air") : schem.palette[idx] || "unknown";
        setHoveredBlock(label + " (" + bx + ", " + layerY + ", " + bz + ")");
      } else {
        setHoveredBlock(null);
      }
    }
  };

  return h(
    "div",
    {
      style: {
        position: "relative",
        borderRadius: "10px",
        border: "1px solid rgba(128, 128, 128, 0.22)",
        background: "rgba(15, 23, 42, 0.55)",
        overflow: "hidden",
      },
    },
    h("canvas", {
      ref: canvasRef,
      width: 680,
      height: 400,
      onMouseDown: (e: { clientX: number }) => {
        dragStartX.current = e.clientX;
      },
      onMouseUp: () => {
        dragStartX.current = null;
      },
      onMouseLeave: () => {
        dragStartX.current = null;
        setHoveredBlock(null);
      },
      onMouseMove: handleMouseMove,
      style: {
        width: "100%",
        height: "400px",
        display: "block",
        cursor: viewMode === "3d" ? "grab" : "crosshair",
      },
    }),
    hoveredBlock
      ? h(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "10px",
              left: "12px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(0, 0, 0, 0.75)",
              color: "#fff",
              fontSize: "12px",
            },
          },
          hoveredBlock,
        )
      : null,
  );
}
