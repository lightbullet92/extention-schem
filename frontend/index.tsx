import type { KubekFrontendModule } from "@kubekpanel/extension-sdk";
import { useExtTranslation } from "./i18n";
import { ServersTab } from "./ServersTab";
import { ViewerTab } from "./ViewerTab";

function GlobalSchematicsPage() {
  const React = window.Kubek!.React as typeof import("react");
  const h = React.createElement;
  const { useState } = React;
  const tr = useExtTranslation();

  const [activeTab, setActiveTab] = useState("servers" as "servers" | "viewer");

  return h(
    "div",
    { style: { padding: "24px", maxWidth: "1040px" } },
    h(
      "div",
      {
        style: {
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid rgba(128, 128, 128, 0.2)",
          paddingBottom: "12px",
          marginBottom: "20px",
        },
      },
      h(
        "button",
        {
          onClick: () => setActiveTab("servers"),
          style: {
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            background: activeTab === "servers" ? "#3b82f6" : "rgba(128, 128, 128, 0.1)",
            color: activeTab === "servers" ? "#fff" : "inherit",
          },
        },
        tr("tab.servers"),
      ),
      h(
        "button",
        {
          onClick: () => setActiveTab("viewer"),
          style: {
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            background: activeTab === "viewer" ? "#3b82f6" : "rgba(128, 128, 128, 0.1)",
            color: activeTab === "viewer" ? "#fff" : "inherit",
          },
        },
        tr("tab.viewer"),
      ),
    ),

    activeTab === "viewer" ? h(ViewerTab, { tr }) : h(ServersTab, { tr }),
  );
}

const frontendModule: KubekFrontendModule = {
  components: {
    Page: GlobalSchematicsPage,
    "global-schematics-nav": GlobalSchematicsPage,
    "com.kubek.global-schematics": GlobalSchematicsPage,
    default: GlobalSchematicsPage,
  },
};

export default frontendModule;