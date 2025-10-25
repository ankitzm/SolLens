import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  browser: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "output",
  manifest: {
    name: "WNA - Wallet Namer",
    description: "Locally name Solana wallet addresses on Solscan",
    version: "0.0.1",
    permissions: ["contextMenus", "storage", "activeTab"],
    host_permissions: ["https://solscan.io/*"],
  },
  webExt: {
    startUrls: ["https://solscan.io"],
    disabled: false,
    binaries: { chrome: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" },
  },
});
