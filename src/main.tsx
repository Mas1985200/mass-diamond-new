import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Mass Diamond root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <div>Mass Diamond</div>
  </StrictMode>,
);
