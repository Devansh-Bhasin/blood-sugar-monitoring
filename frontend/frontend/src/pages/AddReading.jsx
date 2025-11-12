import React, { useState } from "react";
import api from "../api/api";

const AddReading = () => {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mg_dL");
  const [dateTime, setDateTime] = useState("");
  const [foodIntake, setFoodIntake] = useState("");
  const [activities, setActivities] = useState("");
  const [event, setEvent] = useState("");
  const [symptom, setSymptom] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddReading = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      // Try both patient_id and fallback to JWT decode
      let patientId = localStorage.getItem("patient_id");
      if (!patientId && token && token.split('.').length === 3) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          patientId = payload.sub;
        } catch {}
      }
      if (!patientId) {
        alert("Patient ID not found. Please log in as a patient.");
        return;
      }
      await api.post(
        "/readings/",
        {
          value: parseFloat(value),
          unit,
          patient_id: parseInt(patientId),
          food_intake: foodIntake,
          activities,
          event,
          symptom,
          notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Reading added successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to add reading");
    }
  };

  return (
    <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 500, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "2rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Add Blood Sugar Reading</h2>
        <form onSubmit={handleAddReading}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Value</label>
            <input type="number" step="0.01" placeholder="Value" value={value} onChange={e => setValue(e.target.value)} required style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }}>
              <option value="mg_dL">mg/dL</option>
              <option value="mmol_L">mmol/L</option>
            </select>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Date/Time</label>
            <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Food Intake</label>
            <input placeholder="Food Intake" value={foodIntake} onChange={e => setFoodIntake(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Activities</label>
            <input placeholder="Activities" value={activities} onChange={e => setActivities(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Event</label>
            <input placeholder="Event" value={event} onChange={e => setEvent(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Symptom</label>
            <input placeholder="Symptom" value={symptom} onChange={e => setSymptom(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 500 }}>Notes</label>
            <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" }} />
          </div>
          <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: 6, background: "#1976d2", color: "#fff", fontWeight: 600, border: "none", fontSize: "1rem" }}>Add Reading</button>
        </form>
      </div>
    </div>
  );
};

export default AddReading;
