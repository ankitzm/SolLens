import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  browser: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "output",
  webExt: {
    startUrls: ["https://google.com"],
    disabled: true,
    binaries: { chrome: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" },
  },
});
