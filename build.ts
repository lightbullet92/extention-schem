/**
 * Build the frontend half into an ESM bundle the panel serves to the browser. React, react-dom
 * and the SDK are externalized: resolved at runtime from the host (window.Kubek) via an import
 * map, so the bundle stays tiny
 */
const result = await Bun.build({
  entrypoints: ["frontend/index.tsx"],
  outdir: "frontend/dist",
  format: "esm",
  target: "browser",
  external: ["react", "react-dom", "@kubekpanel/extension-sdk"],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log("built frontend/dist/index.js");

export {};
