import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const AdminProfile = () => {
  const { role } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (role === "admin") {
      const fetchProfile = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProfile(res.data);
          setForm(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchProfile();
    }
  }, [role]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.put("/users/me", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated");
      setEditMode(false);
      setProfile(form);
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Admin Profile</h2>
      {editMode ? (
        <div>
          <input name="full_name" value={form.full_name || ""} onChange={handleChange} placeholder="Full Name" />
          <br />
          <input name="email" value={form.email || ""} onChange={handleChange} placeholder="Email" />
          <br />
          <input name="phone" value={form.phone || ""} onChange={handleChange} placeholder="Phone" />
          <br />
          <input name="profile_image" value={form.profile_image || ""} onChange={handleChange} placeholder="Profile Image URL" />
          <br />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditMode(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
        </div>
      ) : (
        <div>
          <p><b>Name:</b> {profile.full_name}</p>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Phone:</b> {profile.phone}</p>
          <p><b>Profile Image:</b> {profile.profile_image}</p>
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
