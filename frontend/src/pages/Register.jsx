import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";


const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  // Patient-specific fields
  const [healthCareNumber, setHealthCareNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [preferredUnit, setPreferredUnit] = useState("mmol_L");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        email,
        password,
        role: role.toLowerCase(),
        full_name: fullName,
        phone,
        profile_image: profileImage
      };
      if (role === "patient") {
        const patientData = {
          user: userData,
          health_care_number: healthCareNumber,
          date_of_birth: dateOfBirth,
          preferred_unit: preferredUnit
        };
        await api.post("/patients/", patientData);
      } else if (role === "specialist") {
        const specialistData = {
          user: userData,
          specialist_code: ""
        };
        await api.post("/specialists/", specialistData);
      } else if (role === "clinic_staff") {
        const staffData = {
          user: userData
        };
        await api.post("/clinic_staff/", staffData);
      } else {
        await api.post("/users/", userData);
      }
  alert("Registration successful");
  window.dispatchEvent(new Event("roleChanged"));
  navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6fa" }}>
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", padding: "2.5rem 2rem", maxWidth: 400, width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem", fontWeight: 700, color: "#1976d2" }}>Register</h2>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Already have an account? <a href="/login" style={{ color: "#1976d2", fontWeight: 500 }}>Login</a>
        </div>
        <form onSubmit={handleRegister}>
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
