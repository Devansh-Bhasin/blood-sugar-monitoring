import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(0); // 0: email, 1: code, 2: reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  // Helper to decode JWT
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) { return {}; }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password }, {
        headers: { 'Content-Type': 'application/json' }
      });
      // Clear all user-related IDs before setting new ones
      localStorage.removeItem("patient_id");
      localStorage.removeItem("specialist_id");
      localStorage.removeItem("staff_id");
      localStorage.setItem("token", res.data.access_token);
      let role = res.data.role ? res.data.role.toLowerCase() : null;
      if (role) {
        localStorage.setItem("role", role);
        window.dispatchEvent(new Event("roleChanged"));
      }
      // --- JWT decode logic ---
      let userId = null;
      if (res.data.access_token && res.data.access_token.split('.').length === 3) {
        const payload = parseJwt(res.data.access_token);
        if (payload && payload.sub) {
          userId = payload.sub;
          if (role === "patient") {
            localStorage.setItem("patient_id", userId);
          } else if (role === "specialist") {
            localStorage.setItem("specialist_id", userId);
          } else if (role === "staff" || role === "clinic_staff") {
            localStorage.setItem("staff_id", userId);
          }
        }
      } else if (res.data.role) {
        // fallback for old token format
        const tokenParts = res.data.access_token.split("-");
        if (tokenParts.length === 2) {
          if (role === "patient") {
            localStorage.setItem("patient_id", tokenParts[1]);
          }
          if (role === "specialist") {
            localStorage.setItem("specialist_id", tokenParts[1]);
          }
          if (role === "staff" || role === "clinic_staff") {
            localStorage.setItem("staff_id", tokenParts[1]);
          }
        }
      }
      alert("Login successful");
      if (role === "staff" || role === "clinic_staff") {
        navigate("/staff-dashboard");
      } else if (role === "specialist") {
        navigate("/specialist-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      alert("Login failed");
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password/request", { email: forgotEmail });
      alert("Reset code sent to your email");
      setForgotStep(1);
    } catch (err) {
      alert("Failed to send reset code");
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password/verify", { email: forgotEmail, code: forgotCode });
      setForgotStep(2);
    } catch (err) {
      alert("Invalid code");
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password/reset", { email: forgotEmail, code: forgotCode, new_password: newPassword });
      alert("Password reset successful. You can now log in.");
      setShowForgot(false);
      setForgotStep(0);
      setForgotEmail("");
      setForgotCode("");
      setNewPassword("");
    } catch (err) {
      alert("Failed to reset password");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fa" }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "2.5rem 2rem", maxWidth: 400, width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem", fontWeight: 700, color: "#1976d2" }}>Login</h2>
        {!showForgot ? (
          <>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
              />
              <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, background: "#1976d2", color: "#fff", fontWeight: 600, border: "none", marginTop: "1rem" }}>Login</button>
            </form>
            <button style={{ width: "100%", marginTop: "1rem", padding: "0.75rem", borderRadius: 8, background: "#e3eafc", color: "#1976d2", fontWeight: 500, border: "none" }} onClick={() => setShowForgot(true)}>
              Forgot Password?
            </button>
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              Don't have an account? <a href="#/register" style={{ color: "#1976d2", fontWeight: 500 }}>Register</a>
            </div>
          </>
        ) : (
          <div style={{ marginTop: "2rem" }}>
            {forgotStep === 0 && (
              <form onSubmit={handleForgotRequest}>
                <h3 style={{ textAlign: "center", color: "#1976d2" }}>Forgot Password</h3>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
                />
                <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, background: "#1976d2", color: "#fff", fontWeight: 600, border: "none", marginTop: "1rem" }}>Send Reset Code</button>
                <button type="button" style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem", borderRadius: 8, background: "#e3eafc", color: "#1976d2", fontWeight: 500, border: "none" }} onClick={() => setShowForgot(false)}>Cancel</button>
              </form>
            )}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotVerify}>
                <h3 style={{ textAlign: "center", color: "#1976d2" }}>Enter Verification Code</h3>
                <input
                  type="text"
                  placeholder="Code from email"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
                />
                <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, background: "#1976d2", color: "#fff", fontWeight: 600, border: "none", marginTop: "1rem" }}>Verify Code</button>
                <button type="button" style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem", borderRadius: 8, background: "#e3eafc", color: "#1976d2", fontWeight: 500, border: "none" }} onClick={() => setShowForgot(false)}>Cancel</button>
              </form>
            )}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotReset}>
                <h3 style={{ textAlign: "center", color: "#1976d2" }}>Set New Password</h3>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
                />
                <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, background: "#1976d2", color: "#fff", fontWeight: 600, border: "none", marginTop: "1rem" }}>Reset Password</button>
                <button type="button" style={{ width: "100%", marginTop: "0.5rem", padding: "0.75rem", borderRadius: 8, background: "#e3eafc", color: "#1976d2", fontWeight: 500, border: "none" }} onClick={() => setShowForgot(false)}>Cancel</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
