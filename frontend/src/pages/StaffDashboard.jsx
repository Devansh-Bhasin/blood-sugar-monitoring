  // Handler for the global threshold form
  const handleThresholdSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert("Please select a patient.");
      return;
    }
    const staffId = getCurrentStaffId ? getCurrentStaffId() : getStaffId();
    if (!staffId) {
      alert("Staff user not found. Please re-login.");
      return;
    }
    try {
      await api.post("/thresholds/", {
        patient_id: parseInt(selectedPatientId),
        min_normal: parseFloat(minNormal),
        max_normal: parseFloat(maxNormal),
        max_borderline: parseFloat(maxBorderline),
        configured_by: staffId
      });
      alert("Thresholds updated!");
      const res = await api.get("/thresholds/");
      setThresholds(res.data);
    } catch (err) {
      alert("Failed to update thresholds");
    }
  };
import React, { useEffect, useState } from "react";
import api, { getCurrentStaffId } from "../api/api";

const StaffDashboard = () => {
  // Helper to refresh assignments for all patients
  const refreshAllAssignments = async () => {
    for (const p of patients) {
      const res = await api.get(`/specialist_patient/patient/${p.patient_id}`);
      setAssignments(prev => ({ ...prev, [p.patient_id]: res.data }));
    }
  };
  const navigate = window.reactRouterNavigate || ((path) => { window.location.href = path; });
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, []);
  const [patients, setPatients] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [minNormal, setMinNormal] = useState(70);
  const [maxNormal, setMaxNormal] = useState(130);
  const [maxBorderline, setMaxBorderline] = useState(180);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [search, setSearch] = useState("");
  const [thresholdInputs, setThresholdInputs] = useState({});

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients/");
        setPatients(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchThresholds = async () => {
      try {
        const res = await api.get("/thresholds/");
        setThresholds(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchSpecialists = async () => {
      try {
        const res = await api.get("/specialists/");
        setSpecialists(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
    fetchThresholds();
    fetchSpecialists();
  }, []);

  useEffect(() => {
    // Fetch assignments for all patients whenever patients change
    patients.forEach(async (p) => {
      const res = await api.get(`/specialist_patient/patient/${p.patient_id}`);
      setAssignments((prev) => ({ ...prev, [p.patient_id]: res.data }));
    });
  }, [patients]);


  const getStaffId = () => {
    const staffId = localStorage.getItem("staff_id");
    if (staffId) return parseInt(staffId);
    // fallback: try to parse from token if possible
    const token = localStorage.getItem("token");
    if (token && token.startsWith("token-")) {
      return parseInt(token.split("-")[1]);
    }
    return null;
  };

  const handlePatientThresholdSubmit = async (e, patient_id) => {
    e.preventDefault();
    const staffId = getStaffId();
    if (!staffId) {
      alert("Staff user not found. Please re-login.");
      return;
    }
    const input = thresholdInputs[patient_id] || {};
    try {
      await api.post("/thresholds/", {
        patient_id,
        min_normal: parseFloat(input.min_normal),
        max_normal: parseFloat(input.max_normal),
        max_borderline: parseFloat(input.max_borderline),
        configured_by: staffId
      });
      alert("Thresholds updated!");
      const res = await api.get("/thresholds/");
      setThresholds(res.data);
    } catch (err) {
      alert("Failed to update thresholds");
    }
  };

  const handleThresholdInputChange = (patient_id, field, value) => {
    setThresholdInputs((prev) => ({
      ...prev,
      [patient_id]: {
        ...prev[patient_id],
        [field]: value
      }
    }));
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Staff Dashboard</h2>
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search patients by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc", width: 300 }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        <div style={{ flex: 2 }}>
          <h3 style={{ marginBottom: "1rem" }}>Patient Records</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
            {patients.filter((p) => {
              const name = p.user.full_name.toLowerCase();
              const id = String(p.patient_id);
              return name.includes(search.toLowerCase()) || id.includes(search);
            }).map((p) => (
              <div key={p.patient_id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "1.5rem", minWidth: 280, maxWidth: 340, flex: "1 1 320px" }}>
                {/* Per-patient threshold form */}
                <form onSubmit={e => handlePatientThresholdSubmit(e, p.patient_id)} style={{ marginTop: 12, background: "#f8f8f8", borderRadius: 8, padding: "0.75rem" }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>Set Thresholds for {p.user.full_name}</div>
                  <div style={{ marginBottom: 8 }}>
                    <label>Min Normal: </label>
                    <input type="number" step="any" value={thresholdInputs[p.patient_id]?.min_normal || ""} onChange={e => handleThresholdInputChange(p.patient_id, "min_normal", e.target.value)} style={{ marginLeft: 8, width: 80 }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>Max Normal: </label>
                    <input type="number" step="any" value={thresholdInputs[p.patient_id]?.max_normal || ""} onChange={e => handleThresholdInputChange(p.patient_id, "max_normal", e.target.value)} style={{ marginLeft: 8, width: 80 }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>Max Borderline: </label>
                    <input type="number" step="any" value={thresholdInputs[p.patient_id]?.max_borderline || ""} onChange={e => handleThresholdInputChange(p.patient_id, "max_borderline", e.target.value)} style={{ marginLeft: 8, width: 80 }} />
                  </div>
                  <button type="submit" style={{ padding: "0.4rem 1.2rem", borderRadius: 6, border: "none", background: "#3498db", color: "#fff", fontWeight: 500, cursor: "pointer" }}>Set Thresholds</button>
                </form>
                {assignments[p.patient_id]?.error && (
                  <div style={{ color: 'red', marginBottom: '0.5rem', fontWeight: 500 }}>
                    {Array.isArray(assignments[p.patient_id].error)
                      ? assignments[p.patient_id].error.join(' | ')
                      : assignments[p.patient_id].error}
                  </div>
                )}
                <div style={{ marginBottom: 8 }}><strong>Name:</strong> {p.user.full_name}</div>
                <div style={{ marginBottom: 8 }}><strong>Email:</strong> {p.user.email}</div>
                <div style={{ marginBottom: 8 }}><strong>Health Care #:</strong> {p.health_care_number}</div>
                <div style={{ marginBottom: 8 }}><strong>Date of Birth:</strong> {p.date_of_birth}</div>
                {assignments[p.patient_id]?.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8 }}><strong>Assigned Specialist:</strong> {specialists.find(s => s.specialist_id === assignments[p.patient_id][0].specialist_id)?.user.full_name || "N/A"}</div>
                    <div style={{ marginBottom: 8 }}><strong>Assigned By Staff ID:</strong> {assignments[p.patient_id][0].assigned_by || "N/A"}</div>
                    <div style={{ marginBottom: 8 }}><strong>Assigned At:</strong> {assignments[p.patient_id][0].assigned_at ? new Date(assignments[p.patient_id][0].assigned_at).toLocaleString() : "N/A"}</div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontWeight: 500 }}>Change Specialist: </label>
                      <select
                        style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid #ccc", marginLeft: 8 }}
                        value={assignments[p.patient_id][0].specialist_id}
                        onChange={async (e) => {
                          const specialistId = e.target.value;
                          if (!specialistId) return;
                          const staffId = getCurrentStaffId();
                          if (!staffId) {
                            alert("Could not determine staff ID. Please log in again.");
                            return;
                          }
                          try {
                            await api.post("/specialist_patient/assign", {
                              specialist_id: parseInt(specialistId),
                              patient_id: p.patient_id,
                              assigned_by: staffId
                            });
                            // Force refresh assignments for all patients
                            await refreshAllAssignments();
                          } catch (err) {
                            await refreshAllAssignments();
                            let errorMsg = "Assignment failed.";
                            if (err.response && err.response.data && err.response.data.detail) {
                              errorMsg = err.response.data.detail;
                            }
                            setAssignments((prev) => ({
                              ...prev,
                              [p.patient_id]: { ...prev[p.patient_id], error: errorMsg }
                            }));
                          }
                        }}
                      >
                        {specialists.map((s) => (
                          <option key={s.specialist_id} value={s.specialist_id}>
                            {s.user.full_name} (ID: {s.specialist_id})
                          </option>
                        ))}
                      </select>
                      <button
                        style={{ marginLeft: 12, padding: "0.4rem 1rem", borderRadius: 6, border: "none", background: "#e74c3c", color: "#fff", fontWeight: 500, cursor: "pointer" }}
                        onClick={async () => {
                          const specialistId = assignments[p.patient_id][0].specialist_id;
                          const staffId = getCurrentStaffId();
                          if (!staffId) {
                            alert("Could not determine staff ID. Please log in again.");
                            return;
                          }
                          await api.post("/specialist_patient/unassign", {
                            specialist_id: specialistId,
                            patient_id: p.patient_id,
                            assigned_by: staffId
                          });
                          // Force refresh assignments for all patients
                          await refreshAllAssignments();
                        }}
                      >Unassign</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontWeight: 500 }}>Assign Specialist: </label>
                    <select
                      style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid #ccc", marginLeft: 8 }}
                      value=""
                      onChange={async (e) => {
                        const specialistId = e.target.value;
                        if (!specialistId) return;
                        const staffId = getCurrentStaffId();
                        if (!staffId) {
                          alert("Could not determine staff ID. Please log in again.");
                          return;
                        }
                        try {
                          await api.post("/specialist_patient/assign", {
                            specialist_id: parseInt(specialistId),
                            patient_id: p.patient_id,
                            assigned_by: staffId
                          });
                          const res = await api.get(`/specialist_patient/patient/${p.patient_id}`);
                          setAssignments((prev) => ({ ...prev, [p.patient_id]: res.data }));
                        } catch (err) {
                          let errorMsg = "Assignment failed.";
                          if (err.response && err.response.data && err.response.data.detail) {
                            errorMsg = err.response.data.detail;
                          }
                          setAssignments((prev) => ({
                            ...prev,
                            [p.patient_id]: { ...prev[p.patient_id], error: errorMsg }
                          }));
                        }
                      }}
                    >
                      <option value="">Select Specialist</option>
                      {specialists.map((s) => (
                        <option key={s.specialist_id} value={s.specialist_id}>
                          {s.user.full_name} (ID: {s.specialist_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginBottom: "1rem" }}>Configure Thresholds</h3>
          <form onSubmit={handleThresholdSubmit} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "1.5rem" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Patient: </label>
              <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} style={{ marginLeft: 8, padding: "0.4rem", borderRadius: 6, border: "1px solid #ccc", width: 180 }}>
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>{p.user.full_name} (ID: {p.patient_id})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Min Normal: </label>
              <input type="number" value={minNormal} onChange={e => setMinNormal(e.target.value)} style={{ marginLeft: 8, padding: "0.4rem", borderRadius: 6, border: "1px solid #ccc", width: 80 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Max Normal: </label>
              <input type="number" value={maxNormal} onChange={e => setMaxNormal(e.target.value)} style={{ marginLeft: 8, padding: "0.4rem", borderRadius: 6, border: "1px solid #ccc", width: 80 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Max Borderline: </label>
              <input type="number" value={maxBorderline} onChange={e => setMaxBorderline(e.target.value)} style={{ marginLeft: 8, padding: "0.4rem", borderRadius: 6, border: "1px solid #ccc", width: 80 }} />
            </div>
            <button type="submit" style={{ padding: "0.5rem 1.5rem", borderRadius: 6, border: "none", background: "#3498db", color: "#fff", fontWeight: 500, cursor: "pointer" }}>Update Thresholds</button>
          </form>
          <h4 style={{ marginTop: "2rem" }}>Current Thresholds (Per Patient)</h4>
          {patients.length === 0 && <div>No patients found.</div>}
          {patients.map((p) => {
            const t = thresholds.find(th => th.patient_id === p.patient_id);
            return (
              <div key={p.patient_id} style={{ background: "#f8f8f8", borderRadius: 8, padding: "0.75rem", marginBottom: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{p.user.full_name} (ID: {p.patient_id})</div>
                {t ? (
                  <div>
                    <span style={{ fontWeight: 500 }}>Min:</span> {t.min_normal}, <span style={{ fontWeight: 500 }}>Max:</span> {t.max_normal}, <span style={{ fontWeight: 500 }}>Borderline:</span> {t.max_borderline}
                  </div>
                ) : (
                  <div style={{ color: '#888' }}>No thresholds set.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
