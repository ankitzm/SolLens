import "~/assets/tailwind.css";

export default defineContentScript({
  matches: ["https://solscan.io/*"],
  
  async main() {
    console.log("[WNA] Content script loaded on Solscan");
    // Phase 3: Address detection and replacement will go here
  },
});

// shadow root ui
// function createUi(ctx: ContentScriptContext) {
//   return createShadowRootUi(ctx, {
//     name: "tailwind-shadow-root-example",
//     position: "inline",
//     anchor: "body",
//     append: "first",
//     onMount: (uiContainer) => {
//       const p = document.createElement("p");
//       p.classList.add("text-lg", "text-red-500", "font-bold", "p-8");
//       p.textContent = "Hello from shadow root with TailwindCSS applied haha";
//       uiContainer.append(p);
//     },
//   });
// }
