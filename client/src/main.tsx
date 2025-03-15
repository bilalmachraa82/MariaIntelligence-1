import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./animations.css"; // Importando animações
import "./i18n/config"; // Importando configuração i18n

createRoot(document.getElementById("root")!).render(<App />);
