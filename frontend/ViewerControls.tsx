import type { InspectedSchematic } from "./types";

interface ViewerControlsProps {
  schem: InspectedSchematic;
  viewMode: "3d" | "layer";
  layerY: number;
  onChangeMode: (mode: "3d" | "layer") => void;
  onRotate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onChangeLayer: (y: number) => void;
  tr: (k: string) => string;
}

export function ViewerControls({
  schem,
  viewMode,
  layerY,
  onChangeMode,
  onRotate,
  onZoomIn,
  onZoomOut,
  onChangeLayer,
  tr,
}: ViewerControlsProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;

  const btnStyle = {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(128, 128, 128, 0.3)",
    background: "transparent",
    fontSize: "13px",
    cursor: "pointer",
  };

  return h(
    React.Fragment,
    null,
    h(
      "div",
      {
        style: {
          padding: "14px 16px",
          borderRadius: "10px",
          border: "1px solid rgba(128, 128, 128, 0.22)",
          background: "rgba(128, 128, 128, 0.05)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        },
      },
      h(
        "div",
        null,
        h("div", { style: { fontWeight: 600, fontSize: "15px" } }, schem.name),
        h(
          "div",
          { style: { fontSize: "12px", opacity: 0.7, marginTop: "2px" } },
          tr("viewer.dimensions") +
            " " + schem.width + " × " + schem.height + " × " + schem.length +
            " | " + tr("viewer.blocksCount") + " " + schem.totalBlocks,
        ),
      ),
      h(
        "div",
        { style: { display: "flex", gap: "8px", alignItems: "center" } },
        h(
          "button",
          {
            onClick: () => onChangeMode("3d"),
            style: {
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: viewMode === "3d" ? "#3b82f6" : "rgba(128, 128, 128, 0.15)",
              color: viewMode === "3d" ? "#fff" : "inherit",
            },
          },
          tr("viewer.mode3d"),
        ),
        h(
          "button",
          {
            onClick: () => onChangeMode("layer"),
            style: {
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: viewMode === "layer" ? "#3b82f6" : "rgba(128, 128, 128, 0.15)",
              color: viewMode === "layer" ? "#fff" : "inherit",
            },
          },
          tr("viewer.modeLayer"),
        ),
        viewMode === "3d"
          ? h("button", { onClick: onRotate, style: btnStyle }, tr("viewer.rotate"))
          : null,
        h("button", { onClick: onZoomIn, style: btnStyle }, "+"),
        h("button", { onClick: onZoomOut, style: btnStyle }, "−"),
      ),
    ),

    viewMode === "layer"
      ? h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(128, 128, 128, 0.06)",
            },
          },
          h(
            "span",
            { style: { fontSize: "13px", fontWeight: 600 } },
            tr("viewer.layerLabel") + " " + (layerY + 1) + " / " + schem.height,
          ),
          h("input", {
            type: "range",
            min: 0,
            max: Math.max(0, schem.height - 1),
            value: layerY,
            onChange: (e: { target: { value: string } }) => onChangeLayer(Number(e.target.value)),
            style: { flex: 1 },
          }),
        )
      : null,
  );
}
