import React, { useEffect, useState } from "react";
import api from "../api/api";

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [threshold, setThreshold] = useState(null);
  const [thresholdForm, setThresholdForm] = useState({ min_normal: '', max_normal: '', max_borderline: '' });

  useEffect(() => {
    const fetchProfileAndThreshold = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/patients/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setForm(res.data);
        // Fetch threshold for this patient
        const patientId = res.data.patient_id;
        try {
          const tRes = await api.get(`/thresholds/patient/${patientId}`);
          setThreshold(tRes.data);
          setThresholdForm({
            min_normal: tRes.data.min_normal,
            max_normal: tRes.data.max_normal,
            max_borderline: tRes.data.max_borderline
          });
        } catch (err) {
          setThreshold(null);
          setThresholdForm({ min_normal: '', max_normal: '', max_borderline: '' });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfileAndThreshold();
  }, []);
  const handleThresholdChange = (e) => {
    setThresholdForm({ ...thresholdForm, [e.target.name]: e.target.value });
  };

  const handleThresholdSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post("/thresholds/", {
        ...thresholdForm,
        patient_id: profile.patient_id,
        configured_by: null // or set staff_id if available
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Thresholds updated!");
      setThreshold({ ...thresholdForm });
    } catch (err) {
      alert("Failed to update thresholds");
    }
  };

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
        ...passwordForm
      }, {
        headers: { Authorization: `Bearer ${token}` },
        params: {},
        data: { user_email: email }
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
    <div style={{ padding: "2rem" }}>
      <h2>Patient Profile</h2>
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
          <input name="health_care_number" value={form.health_care_number || ""} onChange={handleChange} placeholder="Health Care Number" />
          <br />
          <input name="date_of_birth" value={form.date_of_birth || ""} onChange={handleChange} placeholder="Date of Birth" />
          <br />
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
              <br />
              <input
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                placeholder="New Password"
              />
              <br />
              <button onClick={submitPasswordChange}>Update Password</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p><b>Name:</b> {profile.user?.full_name}</p>
          <p><b>Email:</b> {profile.user?.email}</p>
          <p><b>Phone:</b> {profile.user?.phone}</p>
          <p><b>Profile Image:</b> {profile.user?.profile_image}</p>
          <p><b>Health Care Number:</b> {profile.health_care_number}</p>
          <p><b>Date of Birth:</b> {profile.date_of_birth}</p>
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
        </div>
      )}

      {/* Patient threshold view/edit */}
      <div style={{ marginTop: 32, background: '#f8f8f8', borderRadius: 8, padding: 24, maxWidth: 400 }}>
        <h3>My Blood Sugar Thresholds</h3>
        <div>
          <label>Min Normal: </label>
          <input type="number" name="min_normal" value={thresholdForm.min_normal} onChange={handleThresholdChange} style={{ marginLeft: 8, width: 80 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Max Normal: </label>
          <input type="number" name="max_normal" value={thresholdForm.max_normal} onChange={handleThresholdChange} style={{ marginLeft: 8, width: 80 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Max Borderline: </label>
          <input type="number" name="max_borderline" value={thresholdForm.max_borderline} onChange={handleThresholdChange} style={{ marginLeft: 8, width: 80 }} />
        </div>
        <button onClick={handleThresholdSave} style={{ marginTop: 16, padding: '0.5rem 1.5rem', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Save Thresholds</button>
      </div>
    </div>
  );
};

export default PatientProfile;
