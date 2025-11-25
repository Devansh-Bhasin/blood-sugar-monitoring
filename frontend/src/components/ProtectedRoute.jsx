import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Accepts roleRequired as string or array
export default function ProtectedRoute({ roleRequired, children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (roleRequired) {
    if (Array.isArray(roleRequired)) {
      if (!roleRequired.map(r => r.toLowerCase()).includes(role)) {
        return <Navigate to="/login" replace />;
      }
    } else {
      if (role !== roleRequired.toLowerCase()) {
        return <Navigate to="/login" replace />;
      }
    }
  }
  return children;
}
