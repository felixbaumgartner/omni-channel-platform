import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Booking Pages serves an artifact from its own root and forwards only the query
// string and hash, so path-based routes cannot survive a reload or a deep link
// there. VITE_HASH_ROUTER=1 switches that build to hash routing. Vercel keeps
// clean paths, which its vercel.json rewrite already supports.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
