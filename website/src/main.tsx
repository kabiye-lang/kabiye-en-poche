import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

/* The fontsource stylesheets are imported here rather than @import-ed from index.css:
   inside a Tailwind-processed stylesheet their relative `url(./files/*.woff2)` never
   gets rewritten, so the faces 404 in the build and the whole site silently falls back
   to system-ui -- which for Kabiyè means ɖ ɛ ɣ ɩ ɔ ʋ come out of whatever the browser
   happens to have. Imported from JS, Vite resolves and emits them. */
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/andika/400.css";
import "@fontsource/andika/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
