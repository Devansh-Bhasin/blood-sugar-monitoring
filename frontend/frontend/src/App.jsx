import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PatientProfile from "./pages/PatientProfile";
import SpecialistProfile from "./pages/SpecialistProfile";
import SpecialistAppointments from "./pages/SpecialistAppointments";
import PatientAppointments from "./pages/PatientAppointments";
import StaffProfile from "./pages/StaffProfile";
import AddReading from "./pages/AddReading";
import Alerts from "./pages/Alerts";
import StaffAppointments from "./pages/StaffAppointments";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <AuthProvider>
    <Navbar />
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/specialist-dashboard" element={<SpecialistDashboard />} />
      <Route path="/staff-dashboard" element={<StaffDashboard />} />
  
      <Route path="/add-reading" element={<AddReading />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/staff-appointments" element={<StaffAppointments />} />
      <Route path="/specialist-appointments" element={<SpecialistAppointments />} />
      <Route path="/patient-appointments" element={<PatientAppointments />} />
      <Route path="/admin" element={<ProtectedRoute roleRequired={"admin"}><AdminDashboard /></ProtectedRoute>} />
      {/* Catch-all route for 404s */}
      <Route path="*" element={<Register />} />
    </Routes>
  </AuthProvider>
);

export default App;

