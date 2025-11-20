import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roleRequired, children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (roleRequired && role !== roleRequired.toLowerCase()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
