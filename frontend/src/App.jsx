// src/App.jsx
import React from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link 
} from "react-router-dom";

import Dashboard from "./Dashboard";
import Tasks from "./Tasks";
import Login from "./Login"; // your existing login component

export default function App() {
  return (
    <Router>
      <header className="bg-gray-100 p-4 flex space-x-4 max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
        <Link to="/tasks" className="text-blue-600 hover:underline">Tasks</Link>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Routes>
          {/* Redirect root → dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public login page */}
          <Route path="/login" element={<Login />} />

          {/* Protected dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Protected tasks view */}
          <Route path="/tasks" element={<Tasks />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </Router>
  );
}
