import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { role, setRole } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!role;
  // Show only logo on login or registration page
  const currentPath = window.location.hash.replace('#', '');
  const isAuthPage = currentPath === "/login" || currentPath === "/register";
  const patientLinks = [
    { to: "/patient-dashboard", label: "Dashboard" },
    { to: "/add-reading", label: "Add Reading" },
    { to: "/patient-appointments", label: "My Appointments" },
    { to: "/patient-profile", label: "Profile" }
  ];
  const specialistLinks = [
    { to: "/specialist-dashboard", label: "Dashboard" },
    { to: "/specialist-appointments", label: "Appointments" },
    { to: "/specialist-profile", label: "Profile" }
  ];
  const staffLinks = [
    { to: "/staff-dashboard", label: "Dashboard" },
    { to: "/staff-appointments", label: "Appointments" },
    { to: "/staff-profile", label: "Profile" }
  ];
  // Admin links fully removed
  let navLinks = [];
  if (role === "staff" || role === "clinic_staff") {
    navLinks = [...staffLinks];
  } else if (role === "patient") {
    navLinks = [...patientLinks];
  } else if (role === "specialist") {
    navLinks = [...specialistLinks];
  // No admin role UI
  } else {
    navLinks = [{ to: "/register", label: "Register" }];
  }

  // Add logout button for logged-in users
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
    window.dispatchEvent(new Event("roleChanged"));
  navigate("/");
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
        {/* Show dashboard/profile/add reading/logout for all roles if logged in and not on login/register page */}
        {!isAuthPage && isLoggedIn && (
          <>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
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
                {link.label}
              </Link>
            ))}
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
