import { uploadSchematicInChunks } from "./uploadChunked";

interface UploaderProps {
  folder: string;
  onChangeFolder: (val: string) => void;
  onUploaded: (savedName?: string) => Promise<void>;
  onError: (err: string | null) => void;
  tr: (k: string) => string;
}

export function SchematicUploader({
  folder,
  onChangeFolder,
  onUploaded,
  onError,
  tr,
}: UploaderProps) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useRef, useState } = React;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef(null as HTMLInputElement | null);

  const handleFileSelected = async (e: {
    target: { files?: FileList | null; value?: string };
  }) => {
    const file = e.target.files?.item(0);
    if (!file) return;

    setUploading(true);
    setProgress("0%");
    onError(null);
    try {
      const savedName = await uploadSchematicInChunks(file, folder, (pct) =>
        setProgress(pct + "%"),
      );
      await onUploaded(savedName);
    } catch (err) {
      onError(String(err));
    } finally {
      setUploading(false);
      setProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return h(
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
      value: folder,
      onChange: (e: { target: { value: string } }) => onChangeFolder(e.target.value),
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
      accept: ".schem,.schematic,.litematic",
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
      uploading ? tr("viewer.uploading") + " " + progress : tr("viewer.upload"),
    ),
  );
}
