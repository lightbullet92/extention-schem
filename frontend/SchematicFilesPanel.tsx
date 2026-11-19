import { EXT_ID, formatSize } from "./i18n";
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return window.btoa(binary);
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
  const { useEffect, useRef, useState } = React;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadFolder, setUploadFolder] = useState("");
  const fileInputRef = useRef(null as HTMLInputElement | null);

  useEffect(() => {
    if (!uploadFolder && files.length > 0) {
      const firstWithDir = files.find((f) => f.name.includes("/"));
      if (firstWithDir) {
        const dirPart = firstWithDir.name.split("/").slice(0, -1).join("/");
        if (dirPart) setUploadFolder(dirPart);
      }
    }
  }, [files]);

  const handleFileSelected = async (e: {
    target: { files?: FileList | null; value?: string };
  }) => {
    const file = e.target.files?.item(0);
    if (!file) return;

    setUploading(true);
    setUploadProgress("0%");
    onError(null);
    try {
      const http = window.Kubek?.http;
      if (!http) throw new Error("Kubek runtime API unavailable");

      const buffer = await file.arrayBuffer();
      const totalBytes = buffer.byteLength;
      const CHUNK_BYTES = 64 * 1024;
      const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_BYTES));
      const uploadId = Date.now() + "_" + Math.random().toString(36).slice(2, 8);

      let lastRes: { ok: boolean; name?: string } | null = null;
      for (let i = 0; i < totalChunks; i++) {
        const slice = buffer.slice(i * CHUNK_BYTES, Math.min(totalBytes, (i + 1) * CHUNK_BYTES));
        lastRes = (await http.post("ext/" + EXT_ID + "/schematics/upload", {
          uploadId,
          name: file.name,
          folder: uploadFolder.trim(),
          chunkIndex: i,
          totalChunks,
          dataBase64: arrayBufferToBase64(slice),
        })) as { ok: boolean; name?: string };
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100) + "%");
      }

      await onRefreshList();
      if (lastRes?.name) onSelectFile(lastRes.name);
    } catch (err) {
      onError(String(err));
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm(tr("viewer.deleteConfirm") + " (" + name + ")")) return;
    try {
      const http = window.Kubek?.http;
      if (!http) return;
      await http.post("ext/" + EXT_ID + "/schematics/delete", { name });
      await onRefreshList();
    } catch (err) {
      onError(String(err));
    }
  };

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
    h(
      "div",
      {
        style: {
          marginBottom: "14px",
          paddingBottom: "14px",
          borderBottom: "1px solid rgba(128, 128, 128, 0.16)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        },
      },
      h("input", {
        type: "text",
        value: uploadFolder,
        onChange: (e: { target: { value: string } }) => setUploadFolder(e.target.value),
        placeholder: tr("viewer.folderPlaceholder"),
        style: {
          width: "100%",
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid rgba(128, 128, 128, 0.3)",
          background: "rgba(128, 128, 128, 0.08)",
          fontSize: "12px",
          boxSizing: "border-box",
        },
      }),
      h("input", {
        ref: fileInputRef,
        type: "file",
        accept: ".schem,.schematic",
        onChange: handleFileSelected,
        style: { display: "none" },
      }),
      h(
        "button",
        {
          onClick: () => fileInputRef.current?.click(),
          disabled: uploading,
          style: {
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            background: "#10b981",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.65 : 1,
          },
        },
        uploading ? tr("viewer.uploading") + " " + uploadProgress : tr("viewer.upload"),
      ),
    ),

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
          onClick: () => void onRefreshList(),
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

    loadingList
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
                  onClick: () => onSelectFile(f.name),
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
