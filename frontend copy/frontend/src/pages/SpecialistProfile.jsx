import React, { useEffect, useState } from "react";
import api from "../api/api";

const SpecialistProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/specialists/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      user: {
        ...form.user,
        [e.target.name]: e.target.value,
      },
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      // Only send editable user fields
      const updateData = {
        full_name: form.user?.full_name || "",
        email: form.user?.email || "",
        phone: form.user?.phone || "",
        profile_image: form.user?.profile_image || ""
      };
      await api.put("/specialists/me", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated");
      setEditMode(false);
      // Update local profile state
      setProfile({ ...profile, user: { ...profile.user, ...updateData } });
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Specialist Profile</h2>
      {editMode ? (
        <div>
          <input name="full_name" value={form.user?.full_name || ""} onChange={handleChange} placeholder="Full Name" />
          <br />
          <input name="email" value={form.user?.email || ""} onChange={handleChange} placeholder="Email" />
          <br />
          <input name="phone" value={form.user?.phone || ""} onChange={handleChange} placeholder="Phone" />
          <br />
          <input name="profile_image" value={form.user?.profile_image || ""} onChange={handleChange} placeholder="Profile Image URL" />
          <br />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditMode(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
        </div>
      ) : (
        <div>
          <p><b>Name:</b> {profile.user?.full_name}</p>
          <p><b>Email:</b> {profile.user?.email}</p>
          <p><b>Phone:</b> {profile.user?.phone}</p>
          <p><b>Profile Image:</b> {!profile.user?.profile_image ? "None" : profile.user?.profile_image}</p>
          <p><b>Working ID:</b> {profile.specialist_code}</p>
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default SpecialistProfile;
