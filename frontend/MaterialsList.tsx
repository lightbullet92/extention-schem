import { getBlockColor, shadeRgb } from "./colors";
import { formatStacks } from "./i18n";

interface MaterialsListProps {
  materials: Array<{ block: string; count: number }>;
  tr: (k: string) => string;
}

export function MaterialsList({ materials, tr }: MaterialsListProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;

  return h(
    "div",
    {
      style: {
        borderRadius: "10px",
        border: "1px solid rgba(128, 128, 128, 0.22)",
        background: "rgba(128, 128, 128, 0.04)",
        padding: "14px 16px",
      },
    },
    h(
      "div",
      { style: { fontWeight: 600, fontSize: "14px", marginBottom: "10px" } },
      tr("viewer.materialsTitle") +
        " (" +
        materials.length +
        " " +
        tr("viewer.materialsTypes") +
        ")",
    ),
    h(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "8px",
          maxHeight: "220px",
          overflowY: "auto",
        },
      },
      materials.map((m) => {
        const color = getBlockColor(m.block);
        return h(
          "div",
          {
            key: m.block,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: "6px",
              background: "rgba(128, 128, 128, 0.07)",
              fontSize: "12px",
            },
          },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" } },
            h("span", {
              style: {
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: shadeRgb(color, 1),
                flexShrink: 0,
              },
            }),
            h(
              "span",
              {
                style: {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
                title: m.block,
              },
              m.block.replace("minecraft:", ""),
            ),
          ),
          h(
            "span",
            { style: { opacity: 0.75, fontWeight: 600, flexShrink: 0 } },
            formatStacks(m.count, tr),
          ),
        );
      }),
    ),
  );
}
