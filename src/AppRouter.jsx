import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme.css"; // Importa el CSS con variables
import { App } from "./components/App";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter >
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);