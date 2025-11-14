import React, { useEffect, useState } from "react";
import api from "../api/api";

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("PatientProfile token:", token);
        const res = await api.get("/patients/me", {
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
    <div style={{ padding: "2rem" }}>
      <h2>Patient Profile</h2>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <img src={profile.user?.profile_image || "https://randomuser.me/api/portraits/lego/3.jpg"} alt="Profile" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 12, border: "2px solid #1976d2" }} />
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

export default PatientProfile;
