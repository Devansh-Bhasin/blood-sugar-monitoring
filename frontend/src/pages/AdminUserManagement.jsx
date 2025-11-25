import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://blood-sugar-monitoring-system-3c4cc007e08e.herokuapp.com/api";

function AdminUserManagement() {
  const [specialists, setSpecialists] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editType, setEditType] = useState("");
  const [form, setForm] = useState({ email: "", full_name: "", phone: "", profile_image: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpecialists();
    fetchStaff();
  }, []);

  const fetchSpecialists = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/specialists/all`, { headers: { Authorization: `Bearer ${token}` } });
      setSpecialists(res.data);
    } catch (err) {
      setError("Failed to fetch specialists.");
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/clinic_staff/all`, { headers: { Authorization: `Bearer ${token}` } });
      setStaff(res.data);
    } catch (err) {
      setError("Failed to fetch staff.");
    }
  };

  const handleEdit = (user, type) => {
    setEditUser(user);
    setEditType(type);
    setForm({
      email: user.user?.email || user.email || "",
      full_name: user.user?.full_name || user.full_name || "",
      phone: user.user?.phone || user.phone || "",
      profile_image: user.user?.profile_image || user.profile_image || ""
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editType === "specialist") {
        await axios.put(`${API_BASE_URL}/specialists/${editUser.specialist_id}`, { ...editUser, user: { ...form } }, { headers: { Authorization: `Bearer ${token}` } });
        fetchSpecialists();
      } else {
        await axios.put(`${API_BASE_URL}/clinic_staff/${editUser.staff_id}`, { ...editUser, user: { ...form } }, { headers: { Authorization: `Bearer ${token}` } });
        fetchStaff();
      }
      setEditUser(null);
      setEditType("");
    } catch (err) {
      setError("Failed to update user.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Admin User Management</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <h3>Specialists</h3>
      <table border="1" cellPadding="8" style={{ marginBottom: "2rem" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Profile Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {specialists.map(s => (
            <tr key={s.specialist_id}>
              <td>{s.user?.email}</td>
              <td>{s.user?.full_name}</td>
              <td>{s.user?.phone}</td>
              <td>{s.user?.profile_image}</td>
              <td>
                <button onClick={() => handleEdit(s, "specialist")}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Clinic Staff</h3>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Profile Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map(s => (
            <tr key={s.staff_id}>
              <td>{s.user?.email}</td>
              <td>{s.user?.full_name}</td>
              <td>{s.user?.phone}</td>
              <td>{s.user?.profile_image}</td>
              <td>
                <button onClick={() => handleEdit(s, "staff")}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editUser && (
        <form onSubmit={handleUpdate} style={{ marginTop: "2rem" }}>
          <h4>Edit {editType === "specialist" ? "Specialist" : "Staff"}</h4>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
          <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full Name" required />
          <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <input type="text" value={form.profile_image} onChange={e => setForm({ ...form, profile_image: e.target.value })} placeholder="Profile Image" />
          <button type="submit">Update</button>
          <button type="button" onClick={() => setEditUser(null)}>Cancel</button>
        </form>
      )}
    </div>
  );
}

export default AdminUserManagement;
