import React from "react";
import ReactDOM from "react-dom/client";
import App from "./ClientApp.jsx";
import ResetPassword from "./ResetPassword.jsx";
import "./index.css";

const pathname = window.location.pathname;

const RootComponent = pathname.startsWith("/reset-password")
  ? ResetPassword
  : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);