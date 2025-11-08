import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { role } = useAuth();
  const isLoggedIn = !!role;
  // Show only logo on login or registration page
  const currentPath = window.location.hash.replace('#', '');
  const isAuthPage = currentPath === "/login" || currentPath === "/register";
  const patientLinks = [
    { to: "/patient-dashboard", label: "Dashboard" },
    { to: "/add-reading", label: "Add Reading" },
    { to: "/patient-profile", label: "Profile" }
  ];
  const specialistLinks = [
    { to: "/specialist-dashboard", label: "Dashboard" },
    { to: "/specialist-profile", label: "Profile" }
  ];
  const staffLinks = [
    { to: "/staff-dashboard", label: "Dashboard" },
    { to: "/staff-profile", label: "Profile" }
  ];
  const adminLinks = [
    { to: "/admin-dashboard", label: "Dashboard" },
    { to: "/admin-profile", label: "Profile" }
  ];
  let navLinks = [];
  if (role === "staff" || role === "clinic_staff") {
    navLinks = [...staffLinks];
  } else if (role === "patient") {
    navLinks = [...patientLinks];
  } else if (role === "specialist") {
    navLinks = [...specialistLinks];
  } else if (role === "admin") {
    navLinks = [...adminLinks];
  } else {
    navLinks = [{ to: "/register", label: "Register" }];
  }

  // Add logout button for logged-in users
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/register";
  };

  return (
    <nav style={{
      background: "#1976d2",
      color: "white",
      padding: "0.75rem 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderRadius: 0,
      flexWrap: "wrap"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Always show logo */}
        <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
          Blood Sugar Monitor
        </Link>
        {/* Staff: show dashboard/profile/logout only if logged in and not on login/register page */}
        {!isAuthPage && isLoggedIn && (role === "staff" || role === "clinic_staff") && (
          <>
            <Link
              to="/staff-dashboard"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 16,
                padding: "0.3rem 0.7rem",
                borderRadius: 6,
                transition: "background 0.2s",
                background: "none"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#1565c0"}
              onMouseOut={e => e.currentTarget.style.background = "none"}
            >
              Dashboard
            </Link>
            <Link
              to="/staff-profile"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 16,
                padding: "0.3rem 0.7rem",
                borderRadius: 6,
                transition: "background 0.2s",
                background: "none"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#1565c0"}
              onMouseOut={e => e.currentTarget.style.background = "none"}
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              style={{
                color: "white",
                background: "#e74c3c",
                border: "none",
                borderRadius: 6,
                padding: "0.3rem 1rem",
                fontWeight: 500,
                fontSize: 16,
                cursor: "pointer",
                marginLeft: "1rem"
              }}
            >Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
export default Navbar;
