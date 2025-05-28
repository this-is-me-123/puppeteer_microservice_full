import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import LogViewer from "./LogViewer.jsx";
import Login from "./Login.jsx";

const isAuthed = () => !!localStorage.getItem("token");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthed() ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/log/:folder/:file" element={isAuthed() ? <LogViewer /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);