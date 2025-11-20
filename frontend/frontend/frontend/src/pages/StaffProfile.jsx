
import React, { useEffect, useState } from "react";
import api from "../api/api";

const StaffProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/clinic_staff/me", {
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
      await api.put("/clinic_staff/me", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated");
      setEditMode(false);
      setProfile({ ...profile, user: { ...profile.user, ...updateData } });
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  if (!profile) return <div>Loading...</div>;

  const user = profile.user || {};
  const samplePhoto = user.profile_image || "https://randomuser.me/api/portraits/lego/1.jpg";

  return (
    <div style={{ padding: "2rem", maxWidth: 480, margin: "0 auto", background: "#f9f9f9", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#1976d2" }}>Staff Profile</h2>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <img src={samplePhoto} alt="Profile" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 12, border: "2px solid #1976d2" }} />
      </div>
      <div style={{ marginBottom: 16, color: '#555', fontSize: 15 }}>
  <div><b>Staff ID:</b> {profile.staff_id}</div>
      </div>
      {editMode ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input name="full_name" value={form.user?.full_name || ""} onChange={handleChange} placeholder="Full Name" />
          <input name="email" value={form.user?.email || ""} onChange={handleChange} placeholder="Email" />
          <input name="phone" value={form.user?.phone || ""} onChange={handleChange} placeholder="Phone" />
          <input name="profile_image" value={form.user?.profile_image || ""} onChange={handleChange} placeholder="Profile Image URL" />
          <button onClick={handleSave} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem', marginTop: 8 }}>Save</button>
          <button onClick={() => setEditMode(false)} style={{ marginLeft: "1rem", background: '#eee', border: 'none', borderRadius: 6, padding: '0.6rem', marginTop: 8 }}>Cancel</button>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} style={{ marginTop: "1rem", background: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 6, padding: '0.5rem' }}>
            {showPasswordChange ? "Hide Password Change" : "Change Password"}
          </button>
          {showPasswordChange && (
            <div style={{ marginTop: "1rem", display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              <button onClick={submitPasswordChange} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem' }}>Update Password</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: '#333', fontSize: 16 }}>
          <div style={{ marginBottom: 8 }}><b>Name:</b> {user.full_name}</div>
          <div style={{ marginBottom: 8 }}><b>Email:</b> {user.email}</div>
          <div style={{ marginBottom: 8 }}><b>Phone:</b> {user.phone}</div>
          <button onClick={() => setEditMode(true)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem', marginTop: 8 }}>Edit Profile</button>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} style={{ marginLeft: 12, background: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 6, padding: '0.5rem', marginTop: 8 }}>
            {showPasswordChange ? "Hide Password Change" : "Change Password"}
          </button>
          {showPasswordChange && (
            <div style={{ marginTop: "1rem", display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              <button onClick={submitPasswordChange} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem' }}>Update Password</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffProfile;
