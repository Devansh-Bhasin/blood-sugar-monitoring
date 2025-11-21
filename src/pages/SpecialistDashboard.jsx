import React, { useEffect, useState } from "react";
import api from "../api/api";

const SpecialistDashboard = () => {
  const navigate = window.reactRouterNavigate || ((path) => { window.location.href = path; });
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, []);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [readings, setReadings] = useState([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedReadingId, setSelectedReadingId] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [filter, setFilter] = useState({ startDate: "", endDate: "", category: "", patientName: "" });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Use the new endpoint to get only assigned patients
        const token = localStorage.getItem("token");
        const res = await api.get("/specialists/patients", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
  }, []);

  const fetchReadingsForPatient = async (patientId) => {
    try {
      let url = `/readings/patient/${patientId}`;
      let params = {};
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;
      if (filter.category) params.category = filter.category;
      const res = await api.get(url, { params });
      let filteredReadings = res.data;
      // Filter by patient name if needed
      if (filter.patientName) {
        const patient = patients.find(p => p.patient_id === patientId);
        if (!patient.user.full_name.toLowerCase().includes(filter.patientName.toLowerCase())) {
          filteredReadings = [];
        }
      }
      setReadings(filteredReadings);
      setSelectedPatient(patientId);
      // Fetch feedback for patient
      const fbRes = await api.get(`/feedback/patient/${patientId}`);
      setFeedbacks(fbRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText || !selectedPatient || !selectedReadingId) return;
    try {
      const specialistId = localStorage.getItem("specialist_id");
      if (!specialistId) return alert("Specialist ID missing");
      // Always POST new feedback (backend should handle upsert or error)
      await api.post(
        "/feedback/",
        {
          specialist_id: parseInt(specialistId),
          patient_id: selectedPatient,
          reading_id: selectedReadingId,
          comments: feedbackText,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFeedbackText("");
      setSelectedReadingId(null);
      // Refresh feedbacks
      const fbRes = await api.get(`/feedback/patient/${selectedPatient}`);
      setFeedbacks(fbRes.data);
    } catch (err) {
      alert("Failed to submit feedback.");
    }
  };

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 700, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "2rem", marginBottom: "2rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Patients Overview</h2>
        {patients.map((p) => (
          <div key={p.patient_id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, margin: "1rem 0", padding: "1rem", background: "#f9f9f9" }}>
            <p><b>Name:</b> {p.user.full_name}</p>
            <p><b>Email:</b> {p.user.email}</p>
            <p><b>Health Care #:</b> {p.health_care_number}</p>
            <p><b>Date of Birth:</b> {p.date_of_birth}</p>
            <button onClick={() => fetchReadingsForPatient(p.patient_id)} style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none" }}>
              View Readings
            </button>
          </div>
        ))}
      </div>
      {selectedPatient && (
        <div style={{ maxWidth: 700, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Readings for Patient #{selectedPatient}</h3>
          <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <label>Start Date: <input type="date" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} /></label>
            <label>End Date: <input type="date" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} /></label>
            <label>Category:
              <select value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
                <option value="">All</option>
                <option value="Normal">Normal</option>
                <option value="Borderline">Borderline</option>
                <option value="Abnormal">Abnormal</option>
              </select>
            </label>
            <label>Patient Name: <input value={filter.patientName} onChange={e => setFilter({ ...filter, patientName: e.target.value })} /></label>
            <button style={{ marginLeft: "1rem", padding: "0.5rem 1rem", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none" }} onClick={() => fetchReadingsForPatient(selectedPatient)}>Apply Filter</button>
          </div>
          {readings.length === 0 ? (
            <p>No readings found.</p>
          ) : (
            readings.map((r) => {
              // Check if feedback exists for this reading and current specialist
              const specialistId = localStorage.getItem("specialist_id");
              const existingFeedback = feedbacks.find(fb => String(fb.specialist_id) === String(specialistId) && String(fb.reading_id) === String(r.reading_id));
              return (
                <div key={r.reading_id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, margin: "0.5rem 0", padding: "1rem", background: "#f5f5f5" }}>
                  <p><b>Date:</b> {new Date(r.timestamp).toLocaleString()}</p>
                  <p><b>Value:</b> {r.value} {r.unit}</p>
                  <p><b>Category:</b> {r.category}</p>
                  <p><b>Food:</b> {r.food_intake}</p>
                  <p><b>Activities:</b> {r.activities}</p>
                  <p><b>Notes:</b> {r.notes}</p>
                  <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #1976d2", borderRadius: 8, background: "#e3f2fd" }}>
                    <h4>{existingFeedback ? "Edit Feedback" : "Provide Feedback"}</h4>
                    <textarea
                      value={selectedReadingId === r.reading_id ? feedbackText : (existingFeedback ? existingFeedback.comments : "")}
                      onChange={e => {
                        setSelectedReadingId(r.reading_id);
                        setFeedbackText(e.target.value);
                      }}
                      rows={3}
                      style={{ width: "100%", borderRadius: 6, border: "1px solid #ccc", padding: "0.5rem" }}
                      placeholder="Enter feedback/comments"
                    />
                    <button onClick={handleFeedbackSubmit} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none" }}>
                      {existingFeedback ? "Update Feedback" : "Submit Feedback"}
                    </button>
                    {selectedReadingId === r.reading_id && (
                      <button onClick={() => { setSelectedReadingId(null); setFeedbackText(""); }} style={{ marginLeft: "0.5rem", padding: "0.5rem 1rem", borderRadius: 6, background: "#e53935", color: "#fff", border: "none" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div style={{ marginTop: "2rem" }}>
            <h4>Previous Feedback for Patient</h4>
            {feedbacks.length === 0 ? (
              <p>No feedback yet.</p>
            ) : (
              feedbacks.map(fb => (
                <div key={fb.feedback_id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, margin: "0.5rem 0", padding: "1rem", background: "#f5f5f5" }}>
                  <p><b>Specialist:</b> {fb.specialist_id}</p>
                  <p><b>Reading:</b> {fb.reading_id}</p>
                  <p><b>Comments:</b> {fb.comments}</p>
                  <p><b>Date:</b> {new Date(fb.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistDashboard;
