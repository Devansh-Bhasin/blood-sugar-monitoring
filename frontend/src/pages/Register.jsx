import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Only allow patient registration
  const role = "patient";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  // Patient-specific fields
  const [healthCareNumber, setHealthCareNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [preferredUnit, setPreferredUnit] = useState("mmol_L");
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const userData = {
        email,
        password,
        role: role.toLowerCase(),
        full_name: fullName,
        phone,
        profile_image: profileImage
      };
      // Only allow patient registration
      const patientData = {
        user: userData,
        health_care_number: healthCareNumber,
        date_of_birth: dateOfBirth,
        preferred_unit: preferredUnit
      };
      await api.post("/patients/", patientData);
      alert("Registration successful");
      window.dispatchEvent(new Event("roleChanged"));
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMessage(err.response.data.detail);
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fa" }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "2.5rem 2rem", maxWidth: 400, width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem", fontWeight: 700, color: "#1976d2" }}>Register</h2>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Already have an account? <a href="#/login" style={{ color: "#1976d2", fontWeight: 500 }}>Login</a>
        </div>
        {errorMessage && (
          <div style={{ color: '#d32f2f', marginBottom: '1rem', textAlign: 'center', fontWeight: 500 }}>
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleRegister}>
          {/* Only patient registration fields shown */}
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
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
          />
          <input
            type="text"
            placeholder="Profile Image URL"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
            style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}>
            <option value="patient">Patient</option>
            <option value="specialist">Specialist</option>
            <option value="clinic_staff">Clinic Staff</option>
          </select>
          {role === "patient" && (
            <>
              <input
                type="text"
                placeholder="Health Care Number"
                value={healthCareNumber}
                onChange={e => setHealthCareNumber(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
              />
              <input
                type="date"
                placeholder="Date of Birth"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}
              />
              <select value={preferredUnit} onChange={e => setPreferredUnit(e.target.value)} style={{ width: "100%", marginBottom: "1rem", padding: "0.75rem", borderRadius: 8, border: "1px solid #e0e0e0" }}>
                <option value="mmol_L">mmol/L</option>
                <option value="mg_dL">mg/dL</option>
              </select>
            </>
          )}
          <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: 8, background: "#1976d2", color: "#fff", fontWeight: 600, border: "none", marginTop: "1rem" }}>Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
