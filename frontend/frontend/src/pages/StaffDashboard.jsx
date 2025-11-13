import React, { useEffect, useState } from "react";
import api from "../api/api";

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
  const [specialists, setSpecialists] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [minNormal, setMinNormal] = useState(70);
  const [maxNormal, setMaxNormal] = useState(130);
  const [maxBorderline, setMaxBorderline] = useState(180);
  const [searchTerm, setSearchTerm] = useState("");
  const [showApptForm, setShowApptForm] = useState({}); // { patient_id: bool }
  const [apptForm, setApptForm] = useState({}); // { patient_id: { specialist_id, start_time, end_time, reason, notes } }
  const [apptLoading, setApptLoading] = useState({});
  const [apptError, setApptError] = useState({});

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/patients/");
        setPatients(res.data);
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
    fetchSpecialists();
  }, []);

  useEffect(() => {
    // Fetch assignments for all patients whenever patients change
    patients.forEach(async (p) => {
      const res = await api.get(`/specialist_patient/patient/${p.patient_id}`);
      setAssignments((prev) => ({ ...prev, [p.patient_id]: res.data }));
    });
  }, [patients]);

  // Helper to get staffId from localStorage or JWT
  function getStaffId() {
    let staffId = localStorage.getItem("staff_id");
    if (staffId) return parseInt(staffId);
    const token = localStorage.getItem("token");
    if (token && token.split('.').length === 3) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.sub) return parseInt(payload.sub);
      } catch {}
    }
    // fallback for old format
    if (token && token.startsWith("token-")) {
      return parseInt(token.split("-")[1]);
    }
    return 1; // fallback default
  }

  // Filter patients by search term (by name, email, or health care number)
  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.user.full_name.toLowerCase().includes(term) ||
      p.user.email.toLowerCase().includes(term) ||
      (p.health_care_number && p.health_care_number.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>Staff Dashboard</h2>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
        <input
          type="text"
          placeholder="Search patient by name, email, or health care #..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: 350, padding: "0.7rem 1rem", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center" }}>
        {filteredPatients.map((p) => (
          <div key={p.patient_id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "1.5rem", minWidth: 320, maxWidth: 360, flex: "1 1 340px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
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
                      const staffId = getStaffId();
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
                      const staffId = getStaffId();
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
                    const staffId = getStaffId();
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
            {/* Per-patient threshold form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const staffId = getStaffId();
                try {
                  await api.post("/thresholds/", {
                    min_normal: p._minNormal || 70,
                    max_normal: p._maxNormal || 130,
                    max_borderline: p._maxBorderline || 180,
                    configured_by: staffId,
                    patient_id: p.patient_id,
                  });
                  alert("Thresholds updated for this patient!");
                } catch (err) {
                  alert("Failed to update thresholds for this patient");
                }
              }}
              style={{ marginTop: 12, background: "#f8f8f8", borderRadius: 8, padding: "0.75rem" }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Set Thresholds for {p.user.full_name}</div>
              <label>Min Normal: </label>
              <input type="number" step="any" value={p._minNormal || ""} onChange={e => { p._minNormal = e.target.value; setPatients([...patients]); }} style={{ marginLeft: 8, width: 80 }} />
              <label style={{ marginLeft: 12 }}>Max Normal: </label>
              <input type="number" step="any" value={p._maxNormal || ""} onChange={e => { p._maxNormal = e.target.value; setPatients([...patients]); }} style={{ marginLeft: 8, width: 80 }} />
              <label style={{ marginLeft: 12 }}>Max Borderline: </label>
              <input type="number" step="any" value={p._maxBorderline || ""} onChange={e => { p._maxBorderline = e.target.value; setPatients([...patients]); }} style={{ marginLeft: 8, width: 80 }} />
              <button type="submit" style={{ marginLeft: 12, padding: "0.4rem 1.2rem", borderRadius: 6, border: "none", background: "#3498db", color: "#fff", fontWeight: 500, cursor: "pointer" }}>Set Thresholds</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffDashboard;
