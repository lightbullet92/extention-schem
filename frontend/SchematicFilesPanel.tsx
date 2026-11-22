import { SchematicList } from "./files/SchematicList";
import { SchematicUploader } from "./files/SchematicUploader";
import type { SchematicFileInfo } from "./types";

interface FilesPanelProps {
  files: SchematicFileInfo[];
  loadingList: boolean;
  selectedName: string | null;
  onSelectFile: (name: string) => void;
  onRefreshList: () => Promise<void>;
  onError: (err: string | null) => void;
  tr: (k: string) => string;
}

export function SchematicFilesPanel({
  files,
  loadingList,
  selectedName,
  onSelectFile,
  onRefreshList,
  onError,
  tr,
}: FilesPanelProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useEffect, useState } = React;

  const [uploadFolder, setUploadFolder] = useState("");

  useEffect(() => {
    if (!uploadFolder && files.length > 0) {
      const firstWithDir = files.find((f) => f.name.includes("/"));
      if (firstWithDir) {
        const dirPart = firstWithDir.name.split("/").slice(0, -1).join("/");
        if (dirPart) setUploadFolder(dirPart);
      }
    }
  }, [files]);

  return h(
    "div",
    {
      style: {
        borderRadius: "10px",
        border: "1px solid rgba(128, 128, 128, 0.22)",
        background: "rgba(128, 128, 128, 0.04)",
        padding: "14px",
      },
    },
    h(SchematicUploader, {
      folder: uploadFolder,
      onChangeFolder: setUploadFolder,
      onUploaded: async (savedName) => {
        await onRefreshList();
        if (savedName) onSelectFile(savedName);
      },
      onError,
      tr,
    }),
    h(SchematicList, {
      files,
      loading: loadingList,
      selectedName,
      onSelect: onSelectFile,
      onRefresh: onRefreshList,
      onError,
      tr,
    }),
  );
}
