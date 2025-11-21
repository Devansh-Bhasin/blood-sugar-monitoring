import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    const storedRole = localStorage.getItem("role");
    return storedRole ? storedRole.toLowerCase() : null;
  });

  useEffect(() => {
    const handler = () => {
      const storedRole = localStorage.getItem("role");
      setRole(storedRole ? storedRole.toLowerCase() : null);
    };
    window.addEventListener("roleChanged", handler);
    return () => window.removeEventListener("roleChanged", handler);
  }, []);

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
