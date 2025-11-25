// ...restored code from backup...
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });

  const navigate = useNavigate();
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await api.get("/patients/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate("/login");
        } else {
          console.error(err);
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["full_name", "email", "phone", "profile_image"].includes(name)) {
      setForm({
        ...form,
        user: {
          ...form.user,
          [name]: value
        }
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const submitPasswordChange = async () => {
    try {
      const token = localStorage.getItem("token");
      const email = form.user?.email || profile.user?.email;
      await api.post("/auth/change-password", {
<<<<<<< HEAD
        ...passwordForm
      }, {
        headers: { Authorization: `Bearer ${token}` },
        params: {},
        data: { user_email: email }
=======
        ...passwordForm,
        user_email: email
      }, {
        headers: { Authorization: `Bearer ${token}` }
>>>>>>> 4c61778ee2786bffdb2f4e4607f72b83f42e28b5
      });
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
      // Use existing values or fallback for required fields
      const payload = {
        health_care_number: form.health_care_number,
        date_of_birth: form.date_of_birth,
        preferred_unit: form.preferred_unit || "mmol_L",
        user: {
          full_name: form.user?.full_name || "",
          email: form.user?.email || "",
          phone: form.user?.phone || "",
          profile_image: form.user?.profile_image || "",
          password: "dummy", // required by PatientCreate, not used for update
          role: "patient" // required by PatientCreate
        }
      };
      await api.put("/patients/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Profile updated");
      setEditMode(false);
      setProfile({ ...form, user: { ...form.user } });
    } catch (err) {
      alert("Failed to update profile");
    }
  };


  if (!profile) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 480, margin: "0 auto", background: "#f9f9f9", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#1976d2" }}>Patient Profile</h2>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <img src={profile.user?.profile_image || "https://randomuser.me/api/portraits/lego/1.jpg"} alt="Profile" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 12, border: "2px solid #1976d2" }} />
      </div>
      <div style={{ marginBottom: 16, color: '#555', fontSize: 15 }}>
        <div><b>Health Care Number:</b> {profile.health_care_number}</div>
        <div><b>Date of Birth:</b> {profile.date_of_birth}</div>
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
        <div style={{ color: '#333', fontSize: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ marginBottom: 8 }}><b>Name:</b> {profile.user?.full_name}</div>
          <div style={{ marginBottom: 8 }}><b>Email:</b> {profile.user?.email}</div>
          <div style={{ marginBottom: 8 }}><b>Phone:</b> {profile.user?.phone}</div>
<<<<<<< HEAD
          <div style={{ marginBottom: 8 }}><b>Profile Image:</b> {!profile.user?.profile_image ? "None" : profile.user?.profile_image}</div>
          <button onClick={() => setEditMode(true)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem', marginTop: 8 }}>Edit Profile</button>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} style={{ marginLeft: 12, background: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 6, padding: '0.5rem', marginTop: 8 }}>
=======
          <div style={{ marginBottom: 8 }}><b>Profile Image:</b> {!profile.user?.profile_image ? "None" : (
            <img src={profile.user?.profile_image} alt="Profile" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid #1976d2', verticalAlign: 'middle' }} />
          )}</div>
          <button onClick={() => setEditMode(true)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem' }}>Edit Profile</button>
          <button onClick={() => setShowPasswordChange(!showPasswordChange)} style={{ background: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 6, padding: '0.5rem' }}>
>>>>>>> 4c61778ee2786bffdb2f4e4607f72b83f42e28b5
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
}

export default PatientProfile;
