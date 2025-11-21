import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ReadingItem({ reading, refreshReadings, feedback }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...reading });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put(`/readings/${reading.reading_id}`, form);
      alert("Reading updated");
      setEditMode(false);
      refreshReadings();
    } catch (err) {
      alert("Failed to update reading");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this reading?")) return;
    try {
      await api.delete(`/readings/${reading.reading_id}`);
      alert("Reading deleted");
      refreshReadings();
    } catch (err) {
      alert("Failed to delete reading");
    }
  };

  // Find feedback for this reading
  const readingFeedback = feedback.find(f => f.reading_id === reading.reading_id);

  return (
    <div style={{ border: "1px solid gray", margin: "1rem", padding: "1rem" }}>
      {editMode ? (
        <div>
          <input name="value" value={form.value} onChange={handleChange} />
          <input name="unit" value={form.unit} onChange={handleChange} />
          <input name="food_intake" value={form.food_intake || ""} onChange={handleChange} />
          <input name="activities" value={form.activities || ""} onChange={handleChange} />
          <input name="notes" value={form.notes || ""} onChange={handleChange} />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditMode(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
        </div>
      ) : (
        <div>
          <p>Date: {new Date(reading.timestamp).toLocaleString()}</p>
          <p>Value: {reading.value} {reading.unit}</p>
          <p>Category: {reading.category}</p>
          <p>Food: {reading.food_intake}</p>
          <p>Activities: {reading.activities}</p>
          <p>Notes: {reading.notes}</p>
          {readingFeedback && (
            <div style={{ marginTop: '0.5rem', background: '#e3f2fd', borderRadius: 6, padding: '0.5rem 1rem' }}>
              <b>Specialist Feedback:</b> {readingFeedback.comments}
            </div>
          )}
          <button onClick={() => setEditMode(true)}>Edit</button>
          <button onClick={handleDelete} style={{ marginLeft: "1rem" }}>Delete</button>
        </div>
      )}
    </div>
  );
}

const PatientDashboard = () => {
  const navigate = window.reactRouterNavigate || ((path) => { window.location.href = path; });
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, []);
  const [readings, setReadings] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const patientId = localStorage.getItem("patient_id");
        if (!patientId) return;
        const res = await api.get(`/readings/patient/${patientId}`);
        setReadings(res.data);
        // Fetch AI suggestions
        const aiRes = await api.get(`/readings/ai_suggestions/${patientId}`);
        setAiSuggestions(aiRes.data);
        // Fetch specialist feedback
        const feedbackRes = await api.get(`/feedback/patient/${patientId}`);
        setFeedback(feedbackRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, []);

  // Prepare chart data
  const chartData = {
    labels: readings.map(r => new Date(r.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: "Blood Sugar Value",
        data: readings.map(r => r.value),
        borderColor: "#1976d2",
        backgroundColor: "rgba(25, 118, 210, 0.2)",
        tension: 0.3,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Blood Sugar Over Time" },
    },
  };

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 700, width: "100%", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "2rem", marginBottom: "2rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Your Blood Sugar Readings</h2>
        <Line data={chartData} options={chartOptions} />
      </div>
      <div style={{ maxWidth: 700, width: "100%", background: "#f9f9f9", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>AI Suggestions</h3>
        <ul style={{ paddingLeft: "1.5rem" }}>
          {aiSuggestions.length === 0 ? (
            <li>No suggestions yet.</li>
          ) : (
            aiSuggestions.map((s, idx) => <li key={idx}>{s}</li>)
          )}
        </ul>
      </div>
      <div style={{ maxWidth: 700, width: "100%" }}>
        <h3 style={{ marginBottom: "1rem" }}>Reading Details</h3>
        {readings.map((r) => (
          <ReadingItem key={r.reading_id} reading={r} refreshReadings={() => window.location.reload()} feedback={feedback} />
        ))}
      </div>
    </div>
  );
};

export default PatientDashboard;
