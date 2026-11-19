import { EXT_ID } from "./i18n";
import type { ServerItem, ServersResponse } from "./types";

export function ServersTab({ tr }: { tr: (k: string) => string }) {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useEffect, useState } = React;

  const [servers, setServers] = useState([] as ServerItem[]);
  const [selectedIds, setSelectedIds] = useState(new Set([] as string[]));
  const [globalDir, setGlobalDir] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null as string | null);

  const loadServers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const http = window.Kubek?.http;
      if (!http) throw new Error("Kubek runtime API unavailable");

      const data = (await http.get("ext/" + EXT_ID + "/servers")) as ServersResponse;
      setGlobalDir(data.globalDir || "data/global_schematics");
      setServers(data.servers || []);
      setSelectedIds(
        new Set((data.servers || []).filter((s) => s.isLinked).map((s) => s.id) as string[]),
      );
    } catch (err) {
      setMessage(tr("status.loadError") + ": " + String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServers();
  }, []);

  const toggleServer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const http = window.Kubek?.http;
      if (!http) throw new Error("Kubek runtime API unavailable");

      await http.post("ext/" + EXT_ID + "/sync", {
        enabledIds: Array.from(selectedIds),
      });
      setMessage(tr("status.saved"));
      await loadServers();
    } catch (err) {
      setMessage(tr("status.saveError") + ": " + String(err));
    } finally {
      setSaving(false);
    }
  };

  let content: React.ReactNode;
  if (loading) {
    content = h("p", null, tr("page.loading"));
  } else if (servers.length === 0) {
    content = h("p", null, tr("page.empty"));
  } else {
    content = h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "10px" } },
      servers.map((srv) => {
        const checked = selectedIds.has(srv.id);
        return h(
          "label",
          {
            key: srv.id,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "rgba(128, 128, 128, 0.08)",
              border: checked ? "1px solid #3b82f6" : "1px solid rgba(128, 128, 128, 0.2)",
              cursor: "pointer",
            },
          },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "12px" } },
            h("input", {
              type: "checkbox",
              checked,
              onChange: () => toggleServer(srv.id),
              style: { width: "18px", height: "18px" },
            }),
            h(
              "div",
              null,
              h("div", { style: { fontWeight: 600 } }, srv.name),
              h("div", { style: { fontSize: "12px", opacity: 0.65 } }, srv.schematicsPath),
            ),
          ),
          h(
            "span",
            {
              style: {
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "4px",
                fontWeight: 500,
                background:
                  srv.plugin === "FastAsyncWorldEdit"
                    ? "rgba(16, 185, 129, 0.18)"
                    : "rgba(59, 130, 246, 0.18)",
              },
            },
            srv.plugin,
          ),
        );
      }),
    );
  }

  return h(
    "div",
    { style: { maxWidth: "800px" } },
    h("h2", { style: { fontSize: "20px", fontWeight: 600, marginBottom: "8px" } }, tr("page.title")),
    h(
      "p",
      { style: { opacity: 0.7, marginBottom: "20px", fontSize: "14px" } },
      tr("page.sharedDir") + " ",
      h("code", null, globalDir),
    ),
    content,
    h(
      "div",
      { style: { marginTop: "20px", display: "flex", gap: "12px", alignItems: "center" } },
      h(
        "button",
        {
          onClick: handleSave,
          disabled: saving || loading || servers.length === 0,
          style: {
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            cursor: saving || loading || servers.length === 0 ? "not-allowed" : "pointer",
            opacity: saving || loading || servers.length === 0 ? 0.6 : 1,
          },
        },
        saving ? tr("action.saving") : tr("action.save"),
      ),
      h(
        "button",
        {
          onClick: loadServers,
          disabled: loading || saving,
          style: {
            padding: "10px 16px",
            borderRadius: "6px",
            border: "1px solid rgba(128, 128, 128, 0.3)",
            background: "transparent",
            cursor: "pointer",
          },
        },
        tr("action.refresh"),
      ),
    ),
    message ? h("p", { style: { marginTop: "14px", fontSize: "14px", color: "#3b82f6" } }, message) : null,
  );
}
