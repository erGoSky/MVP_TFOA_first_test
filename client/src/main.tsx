import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { MetadataProvider } from "./context/MetadataContext";
import { SimulationProvider } from "./context/SimulationContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MetadataProvider>
        <SimulationProvider>
          <App />
        </SimulationProvider>
      </MetadataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
