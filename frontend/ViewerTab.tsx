import { EXT_ID } from "./i18n";
import { MaterialsList } from "./MaterialsList";
import { SchematicCanvas } from "./SchematicCanvas";
import { SchematicFilesPanel } from "./SchematicFilesPanel";
import type { InspectedSchematic, SchematicFileInfo } from "./types";
import { ViewerControls } from "./ViewerControls";

export function ViewerTab({ tr }: { tr: (k: string) => string }) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useEffect, useState } = React;

  const [files, setFiles] = useState([] as SchematicFileInfo[]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedName, setSelectedName] = useState(null as string | null);
  const [schem, setSchem] = useState(null as InspectedSchematic | null);
  const [loadingSchem, setLoadingSchem] = useState(false);
  const [error, setError] = useState(null as string | null);

  const [viewMode, setViewMode] = useState("3d" as "3d" | "layer");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [layerY, setLayerY] = useState(0);

  const loadFiles = async () => {
    setLoadingList(true);
    setError(null);
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
        setSchem(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoadingList(false);
    }
  };

  const inspectFile = async (name: string) => {
    setSelectedName(name);
    setLoadingSchem(true);
    setError(null);
    try {
      const http = window.Kubek?.http;
      if (!http) return;
      const data = (await http.post("ext/" + EXT_ID + "/schematics/inspect", {
        name,
      })) as InspectedSchematic;
      setSchem(data);
      setLayerY(0);
      setRotation(0);
      setZoom(1);
    } catch (err) {
      setError(String(err));
      setSchem(null);
    } finally {
      setLoadingSchem(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

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
      onSelectFile: (name) => void inspectFile(name),
      onRefreshList: loadFiles,
      onError: setError,
      tr,
    }),

    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "16px" } },
      error ? h("p", { style: { color: "#ef4444", fontSize: "14px" } }, error) : null,

      loadingSchem
        ? h("p", null, tr("viewer.parsing"))
        : !schem
          ? h(
              "div",
              {
                style: {
                  padding: "48px 24px",
                  borderRadius: "10px",
                  border: "1px dashed rgba(128, 128, 128, 0.3)",
                  textAlign: "center",
                  opacity: 0.65,
                },
              },
              tr("viewer.selectPrompt"),
            )
          : h(
              React.Fragment,
              null,
              h(ViewerControls, {
                schem,
                viewMode,
                layerY,
                onChangeMode: setViewMode,
                onRotate: () => setRotation((r) => r + 1),
                onZoomIn: () => setZoom((z) => Math.min(4, z + 0.25)),
                onZoomOut: () => setZoom((z) => Math.max(0.25, z - 0.25)),
                onChangeLayer: setLayerY,
                tr,
              }),
              h(SchematicCanvas, {
                schem,
                viewMode,
                rotation,
                zoom,
                layerY,
                onRotateStep: (delta) => setRotation((r) => r + delta),
                tr,
              }),
              h(MaterialsList, { materials: schem.materials, tr }),
            ),
    ),
  );
}
