import { EXT_ID } from "./i18n";
import { MaterialsList } from "./MaterialsList";
import { SchematicCanvas } from "./SchematicCanvas";
import { SchematicFilesPanel } from "./SchematicFilesPanel";
import type { InspectedSchematic, SchematicFileInfo } from "./types";
import { ViewerControls } from "./ViewerControls";

function decodeBlocksRle(rle: number[], volume: number): number[] {
  const out = new Array<number>(volume).fill(0);
  let pos = 0;
  for (let i = 0; i < rle.length; i += 2) {
    const val = rle[i] ?? 0;
    const count = rle[i + 1] ?? 0;
    out.fill(val, pos, Math.min(volume, pos + count));
    pos += count;
  }
  return out;
}

interface ViewerTabProps {
  tr: (k: string) => string;
}

export function ViewerTab({ tr }: ViewerTabProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useEffect, useState } = React;

  const [files, setFiles] = useState([] as SchematicFileInfo[]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedName, setSelectedName] = useState(null as string | null);
  const [inspected, setInspected] = useState(null as InspectedSchematic | null);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [error, setError] = useState(null as string | null);

  const [viewMode, setViewMode] = useState("3d" as "3d" | "layer");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [layerY, setLayerY] = useState(0);

  const fetchList = async () => {
    setLoadingList(true);
    try {
      const http = window.Kubek?.http;
      if (!http) return;
      const data = (await http.get("ext/" + EXT_ID + "/schematics")) as {
        files: SchematicFileInfo[];
      };
      const list = data.files || [];
      setFiles(list);
      if (selectedName && !list.some((f) => f.name === selectedName)) {
        setSelectedName(null);
        setInspected(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void fetchList();
  }, []);

  const handleSelectFile = async (name: string) => {
    setSelectedName(name);
    setLoadingInspect(true);
    setError(null);
    try {
      const http = window.Kubek?.http;
      if (!http) return;
      const res = (await http.post("ext/" + EXT_ID + "/schematics/inspect", {
        name,
      })) as InspectedSchematic & { blocksRle?: number[] };

      if (Array.isArray(res.blocksRle)) {
        res.blocks = decodeBlocksRle(res.blocksRle, res.width * res.height * res.length);
      }

      setInspected(res);
      setRotation(0);
      setZoom(1);
      setLayerY(Math.floor(res.height / 2));
    } catch (err) {
      setError(String(err));
      setInspected(null);
    } finally {
      setLoadingInspect(false);
    }
  };

  return h(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "290px 1fr",
        gap: "20px",
        alignItems: "start",
      },
    },
    h(SchematicFilesPanel, {
      files,
      loadingList,
      selectedName,
      onSelectFile: (name) => void handleSelectFile(name),
      onRefreshList: fetchList,
      onError: setError,
      tr,
    }),

    h(
      "div",
      { style: { minWidth: 0 } },
      error
        ? h(
            "p",
            { style: { color: "#ef4444", fontSize: "13px", marginBottom: "12px" } },
            error,
          )
        : null,

      loadingInspect
        ? h(
            "div",
            {
              style: {
                padding: "48px",
                textAlign: "center",
                borderRadius: "10px",
                border: "1px solid rgba(128, 128, 128, 0.22)",
                opacity: 0.75,
              },
            },
            tr("viewer.loadingInspect"),
          )
        : !inspected
          ? h(
              "div",
              {
                style: {
                  padding: "48px",
                  textAlign: "center",
                  borderRadius: "10px",
                  border: "1px solid rgba(128, 128, 128, 0.22)",
                  opacity: 0.65,
                  fontSize: "14px",
                },
              },
              tr("viewer.selectHint"),
            )
          : h(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: "16px" } },
              h(ViewerControls, {
                schem: inspected,
                viewMode,
                onChangeMode: setViewMode,
                onRotate: () => setRotation((r) => (r + 1) % 4),
                onZoomIn: () => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2))),
                onZoomOut: () => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2))),
                layerY,
                onChangeLayer: setLayerY,
                tr,
              }),
              h(SchematicCanvas, {
                schem: inspected,
                viewMode,
                rotation,
                zoom,
                layerY,
                onRotateStep: (delta) => setRotation((r) => (r + delta + 4) % 4),
                tr,
              }),
              h(MaterialsList, {
                materials: inspected.materials,
                tr,
              }),
            ),
    ),
  );
}
