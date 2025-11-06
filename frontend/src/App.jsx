import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import PatientProfile from "./pages/PatientProfile";
import SpecialistProfile from "./pages/SpecialistProfile";
import StaffProfile from "./pages/StaffProfile";
import AddReading from "./pages/AddReading";
import Alerts from "./pages/Alerts";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/specialist-dashboard" element={<SpecialistDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/add-reading" element={<AddReading />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/patient-profile" element={<PatientProfile />} />
        <Route path="/specialist-profile" element={<SpecialistProfile />} />
        <Route path="/staff-profile" element={<StaffProfile />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
