import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "@canva/app-ui-kit/styles.css";

const root = createRoot(document.getElementById("root") as Element);
root.render(
  <AppUiProvider>
    <App />
  </AppUiProvider>
);
