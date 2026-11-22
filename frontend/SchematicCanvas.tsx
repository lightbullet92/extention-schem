import { renderIsometric3d } from "./canvas/renderIso3d";
import { getHoveredLayerBlock, renderLayerSlice } from "./canvas/renderLayer";
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (viewMode === "layer") {
      renderLayerSlice(ctx, canvas.width, canvas.height, schem, layerY, zoom);
    } else {
      renderIsometric3d(ctx, canvas.width, canvas.height, schem, rotation, zoom);
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
      setHoveredBlock(
        getHoveredLayerBlock(
          mx,
          my,
          e.currentTarget.width,
          e.currentTarget.height,
          schem,
          layerY,
          zoom,
          tr("viewer.air"),
        ),
      );
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
