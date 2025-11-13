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
  const [patientReadings, setPatientReadings] = useState({}); // { patient_id: [readings] }
  const [patientFeedbacks, setPatientFeedbacks] = useState({}); // { patient_id: [feedbacks] }
  const [feedbackText, setFeedbackText] = useState({}); // { patient_id: text }
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingFeedbackText, setEditingFeedbackText] = useState("");
  const [expandedReadings, setExpandedReadings] = useState({}); // { patient_id: bool }
  const [expandedFeedback, setExpandedFeedback] = useState({}); // { patient_id: bool }
  const [showFeedbackInput, setShowFeedbackInput] = useState({}); // { patient_id: reading_id }
  const [viewLog, setViewLog] = useState({}); // { patient_id: reading_id or feedback_id }
  const [filter, setFilter] = useState({ startDate: "", endDate: "", category: "", patientName: "" });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/specialists/patients", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(res.data);
        // For each patient, fetch readings and feedbacks
        for (const p of res.data) {
          fetchReadingsAndFeedbacks(p.patient_id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
    // eslint-disable-next-line
  }, []);

  const fetchReadingsAndFeedbacks = async (patientId) => {
    try {
      let url = `/readings/patient/${patientId}`;
      let params = {};
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;
      if (filter.category) params.category = filter.category;
      const res = await api.get(url, { params });
      setPatientReadings(prev => ({ ...prev, [patientId]: res.data }));
      const fbRes = await api.get(`/feedback/patient/${patientId}`);
      setPatientFeedbacks(prev => ({ ...prev, [patientId]: fbRes.data }));
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleFeedbackSubmit = async (patientId, readingId) => {
    const text = feedbackText[patientId];
    if (!text || !patientId || !readingId) return;
    try {
      const specialistId = localStorage.getItem("specialist_id");
      const token = localStorage.getItem("token");
      if (!specialistId) return alert("Specialist ID missing");
      if (!token) return alert("Not authenticated");
      await api.post(
        "/feedback/",
        {
          specialist_id: parseInt(specialistId),
          patient_id: patientId,
          reading_id: readingId,
          comments: text,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackText(prev => ({ ...prev, [patientId]: "" }));
      fetchReadingsAndFeedbacks(patientId);
    } catch (err) {
      alert("Failed to submit feedback.");
    }
  };

  const handleEditFeedback = (fb) => {
    setEditingFeedbackId(fb.feedback_id);
    setEditingFeedbackText(fb.comments);
  };

  const handleUpdateFeedback = async (fb, patientId) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(
        `/feedback/${fb.feedback_id}`,
        { comments: editingFeedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingFeedbackId(null);
      setEditingFeedbackText("");
      fetchReadingsAndFeedbacks(patientId);
    } catch (err) {
      alert("Failed to update feedback.");
    }
  };

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Patients Overview</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
        {patients.map((p) => (
          <div key={p.patient_id} style={{ border: "1px solid #e0e0e0", borderRadius: 12, width: 340, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "1.2rem", marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <p><b>Name:</b> {p.user.full_name}</p>
            <p><b>Email:</b> {p.user.email}</p>
            <p><b>Health Care #:</b> {p.health_care_number}</p>
            <p><b>Date of Birth:</b> {p.date_of_birth}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => setExpandedReadings(prev => ({ ...prev, [p.patient_id]: !prev[p.patient_id] }))} style={{ padding: "0.3rem 0.8rem", borderRadius: 6, background: expandedReadings[p.patient_id] ? "#1976d2" : "#e0e0e0", color: expandedReadings[p.patient_id] ? "#fff" : "#222", border: "none" }}>{expandedReadings[p.patient_id] ? "Hide Readings" : "View Readings"}</button>
              <button onClick={() => setExpandedFeedback(prev => ({ ...prev, [p.patient_id]: !prev[p.patient_id] }))} style={{ padding: "0.3rem 0.8rem", borderRadius: 6, background: expandedFeedback[p.patient_id] ? "#1976d2" : "#e0e0e0", color: expandedFeedback[p.patient_id] ? "#fff" : "#222", border: "none" }}>{expandedFeedback[p.patient_id] ? "Hide Feedback" : "View Feedback"}</button>
            </div>
            {/* Readings Section */}
            {expandedReadings[p.patient_id] && (
              <div style={{ marginTop: 10, width: "100%" }}>
                <h4 style={{ margin: 0 }}>Readings</h4>
                {(patientReadings[p.patient_id] && patientReadings[p.patient_id].length > 0) ? (
                  patientReadings[p.patient_id].map((r) => (
                    <div key={r.reading_id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, margin: "0.5rem 0", padding: "0.5rem", background: "#f5f5f5", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span><b>Date:</b> {new Date(r.timestamp).toLocaleString()}</span>
                        <button onClick={() => setViewLog({ [p.patient_id]: r.reading_id })} style={{ fontSize: 12, background: "#e0e0e0", border: "none", borderRadius: 4, padding: "0.2rem 0.6rem", marginLeft: 8 }}>View Log</button>
                      </div>
                      {viewLog[p.patient_id] === r.reading_id ? (
                        <div style={{ marginTop: 6, fontSize: 14 }}>
                          <p><b>Value:</b> {r.value} {r.unit}</p>
                          <p><b>Category:</b> {r.category}</p>
                          <p><b>Food:</b> {r.food_intake}</p>
                          <p><b>Activities:</b> {r.activities}</p>
                          <p><b>Notes:</b> {r.notes}</p>
                          <button onClick={() => setViewLog({})} style={{ fontSize: 12, background: "#e53935", color: "#fff", border: "none", borderRadius: 4, padding: "0.2rem 0.6rem", marginTop: 4 }}>Close</button>
                        </div>
                      ) : null}
                      <div style={{ marginTop: 6 }}>
                        <button onClick={() => setShowFeedbackInput(prev => ({ ...prev, [p.patient_id]: r.reading_id }))} style={{ fontSize: 12, background: "#43a047", color: "#fff", border: "none", borderRadius: 4, padding: "0.2rem 0.7rem" }}>Provide Feedback</button>
                        {showFeedbackInput[p.patient_id] === r.reading_id && (
                          <div style={{ marginTop: 6 }}>
                            <textarea
                              value={feedbackText[p.patient_id] || ""}
                              onChange={e => setFeedbackText(prev => ({ ...prev, [p.patient_id]: e.target.value }))}
                              rows={2}
                              style={{ width: "100%", borderRadius: 6, border: "1px solid #ccc", padding: "0.5rem" }}
                              placeholder="Enter feedback/comments"
                            />
                            <button onClick={() => handleFeedbackSubmit(p.patient_id, r.reading_id)} style={{ marginTop: 4, padding: "0.3rem 0.8rem", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none" }}>Submit Feedback</button>
                            <button onClick={() => setShowFeedbackInput(prev => ({ ...prev, [p.patient_id]: null }))} style={{ marginLeft: 6, marginTop: 4, padding: "0.3rem 0.8rem", borderRadius: 6, background: "#e0e0e0", color: "#222", border: "none" }}>Cancel</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No readings found.</p>
                )}
              </div>
            )}
            {/* Feedback Section */}
            {expandedFeedback[p.patient_id] && (
              <div style={{ marginTop: 10, width: "100%" }}>
                <h4 style={{ margin: 0 }}>Feedback</h4>
                {(patientFeedbacks[p.patient_id] && patientFeedbacks[p.patient_id].length > 0) ? (
                  patientFeedbacks[p.patient_id].map(fb => (
                    <div key={fb.feedback_id} style={{ border: "1px solid #e0e0e0", borderRadius: 8, margin: "0.5rem 0", padding: "0.5rem", background: "#e3f2fd", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span><b>Reading:</b> {fb.reading_id}</span>
                        <button onClick={() => setViewLog({ [p.patient_id]: fb.feedback_id })} style={{ fontSize: 12, background: "#e0e0e0", border: "none", borderRadius: 4, padding: "0.2rem 0.6rem", marginLeft: 8 }}>View Log</button>
                      </div>
                      {viewLog[p.patient_id] === fb.feedback_id ? (
                        <div style={{ marginTop: 6, fontSize: 14 }}>
                          <p><b>Specialist:</b> {fb.specialist_id}</p>
                          <p><b>Comments:</b> {editingFeedbackId === fb.feedback_id ? (
                            <>
                              <textarea
                                value={editingFeedbackText}
                                onChange={e => setEditingFeedbackText(e.target.value)}
                                rows={2}
                                style={{ width: "100%", borderRadius: 6, border: "1px solid #ccc", padding: "0.5rem" }}
                              />
                              <button onClick={() => handleUpdateFeedback(fb, p.patient_id)} style={{ marginTop: 4, marginRight: 8, padding: "0.3rem 0.8rem", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none" }}>Save</button>
                              <button onClick={() => setEditingFeedbackId(null)} style={{ marginTop: 4, padding: "0.3rem 0.8rem", borderRadius: 6, background: "#e53935", color: "#fff", border: "none" }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <span>{fb.comments}</span>
                              <button onClick={() => handleEditFeedback(fb)} style={{ marginLeft: 8, padding: "0.2rem 0.7rem", borderRadius: 6, background: "#ffb300", color: "#222", border: "none" }}>Edit</button>
                            </>
                          )}</p>
                          <div style={{ fontSize: 12, color: "#555" }}>on {new Date(fb.created_at).toLocaleString()}</div>
                          <button onClick={() => setViewLog({})} style={{ fontSize: 12, background: "#e53935", color: "#fff", border: "none", borderRadius: 4, padding: "0.2rem 0.6rem", marginTop: 4 }}>Close</button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p>No feedback yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialistDashboard;
