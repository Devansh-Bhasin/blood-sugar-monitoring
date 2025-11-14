
import React, { useEffect, useState } from "react";
import api from "../api/api";

const SpecialistProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });

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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const submitPasswordChange = async () => {
    try {
      const token = localStorage.getItem("token");
      const email = form.user?.email || profile.user?.email;
      await api.post(
        "/auth/change-password",
        {
          ...passwordForm,
          user_email: email
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert("Password updated successfully");
      setShowPasswordChange(false);
      setPasswordForm({ current_password: '', new_password: '' });
    } catch (err) {
      alert("Failed to update password");
    }
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <img src={profile.user?.profile_image || "https://randomuser.me/api/portraits/lego/2.jpg"} alt="Profile" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 12, border: "2px solid #1976d2" }} />
      </div>
      {editMode ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input name="full_name" value={form.user?.full_name || ""} onChange={handleChange} placeholder="Full Name" />
          <input name="email" value={form.user?.email || ""} onChange={handleChange} placeholder="Email" />
          <input name="phone" value={form.user?.phone || ""} onChange={handleChange} placeholder="Phone" />
          <input name="profile_image" value={form.user?.profile_image || ""} onChange={handleChange} placeholder="Profile Image URL" />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditMode(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
          <br /><br />
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} style={{ marginTop: "1rem" }}>
            {showPasswordChange ? "Hide Password Change" : "Change Password"}
          </button>
          {showPasswordChange && (
            <div style={{ marginTop: "1rem" }}>
              <input
                type="password"
                name="current_password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                placeholder="Current Password"
              />
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                placeholder="New Password"
              />
              <button onClick={submitPasswordChange}>Update Password</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p><b>Name:</b> {profile.user?.full_name}</p>
          <p><b>Email:</b> {profile.user?.email}</p>
          <p><b>Phone:</b> {profile.user?.phone}</p>
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default SpecialistProfile;
