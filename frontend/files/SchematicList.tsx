import { EXT_ID, formatSize } from "../i18n";
import type { SchematicFileInfo } from "../types";

interface SchematicListProps {
  files: SchematicFileInfo[];
  loading: boolean;
  selectedName: string | null;
  onSelect: (name: string) => void;
  onRefresh: () => Promise<void>;
  onError: (err: string | null) => void;
  tr: (k: string) => string;
}

export function SchematicList({
  files,
  loading,
  selectedName,
  onSelect,
  onRefresh,
  onError,
  tr,
}: SchematicListProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;

  const handleDelete = async (name: string) => {
    if (!window.confirm(tr("viewer.deleteConfirm") + " (" + name + ")")) return;
    try {
      const http = window.Kubek?.http;
      if (!http) return;
      await http.post("ext/" + EXT_ID + "/schematics/delete", { name });
      await onRefresh();
    } catch (err) {
      onError(String(err));
    }
  };

  return h(
    React.Fragment,
    null,
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        },
      },
      h("strong", { style: { fontSize: "14px" } }, tr("viewer.files") + " (" + files.length + ")"),
      h(
        "button",
        {
          onClick: () => void onRefresh(),
          style: {
            padding: "4px 10px",
            borderRadius: "5px",
            border: "1px solid rgba(128, 128, 128, 0.3)",
            background: "transparent",
            fontSize: "12px",
            cursor: "pointer",
          },
        },
        tr("viewer.refresh"),
      ),
    ),

    loading
      ? h("p", { style: { fontSize: "13px", opacity: 0.7 } }, tr("viewer.loadingList"))
      : files.length === 0
        ? h("p", { style: { fontSize: "13px", opacity: 0.65 } }, tr("viewer.emptyFiles"))
        : h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "480px",
                overflowY: "auto",
              },
            },
            files.map((f) => {
              const active = selectedName === f.name;
              return h(
                "div",
                {
                  key: f.name,
                  onClick: () => onSelect(f.name),
                  style: {
                    padding: "8px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: active ? "rgba(59, 130, 246, 0.2)" : "rgba(128, 128, 128, 0.06)",
                    border: active ? "1px solid #3b82f6" : "1px solid transparent",
                  },
                },
                h(
                  "div",
                  { style: { overflow: "hidden" } },
                  h(
                    "div",
                    {
                      style: {
                        fontSize: "13px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    },
                    f.name,
                  ),
                  h("div", { style: { fontSize: "11px", opacity: 0.6 } }, formatSize(f.size, tr)),
                ),
                h(
                  "button",
                  {
                    onClick: (e: { stopPropagation: () => void }) => {
                      e.stopPropagation();
                      void handleDelete(f.name);
                    },
                    title: tr("viewer.deleteTitle"),
                    style: {
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "none",
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#ef4444",
                      fontSize: "12px",
                      cursor: "pointer",
                    },
                  },
                  "×",
                ),
              );
            }),
          ),
  );
}
