import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import LogViewer from "./components/LogViewer";

export default function App() {
  return (
    <Router>
      <main className="min-h-screen bg-gray-100 text-gray-900 p-4">
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log/:folder/:file" element={<LogViewer />} />
        </Routes>
      </main>
    </Router>
  );
}
