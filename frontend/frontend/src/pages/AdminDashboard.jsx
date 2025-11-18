import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


function AdminDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    if (!role || role !== 'admin') {
      navigate('/login');
    }
  }, [role, navigate]);

  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dailyAverages, setDailyAverages] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchReports(selectedReportType);
    fetchAdminSummary();
    fetchDailyAverages(30);
  }, [selectedReportType]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/`, { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`, { withCredentials: true });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const fetchAdminSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/admin/summary`, { headers });
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching admin summary:', err);
    }
  };

  const fetchReports = async (type) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/reports/`, { withCredentials: true });
      const data = res.data || [];
      // normalize type strings for filtering (backend stores e.g. 'Monthly' or 'monthly')
      const normalized = data.filter(r => {
        if (!type) return true;
        const t = String(r.type || r.period || '').toLowerCase();
        return t.includes(type.toLowerCase());
      });
      setReports(normalized);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
    setLoading(false);
  };

  const fetchDailyAverages = async (days = 30) => {
    setChartLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/admin/readings/daily-averages?days=${days}`, { headers });
      setDailyAverages(res.data.data || []);
    } catch (err) {
      console.error('Error fetching daily averages:', err);
      setDailyAverages([]);
    }
    setChartLoading(false);
  };

  const chartData = useMemo(() => ({
    labels: dailyAverages.map(d => d.date),
    datasets: [
      {
        label: 'Avg Glucose (mmol/L)',
        data: dailyAverages.map(d => Math.round((d.avg || 0) * 100) / 100),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.2,
      },
    ],
  }), [dailyAverages]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false, text: 'Daily Average Glucose' },
    },
  }), []);

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard</h2>
      <section>
        <h3>User Management</h3>
        {summary && (
          <div className="admin-summary-cards" style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div className="card">Total Users: {summary.total_users}</div>
            <div className="card">Patients: {summary.total_patients}</div>
            <div className="card">Specialists: {summary.total_specialists}</div>
            <div className="card">Readings: {summary.total_readings}</div>
            <div className="card">Avg Glucose: {Math.round(summary.average_glucose * 100) / 100}</div>
            <div className="card">Alerts: {summary.alerts_count}</div>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Reports</h3>
        <div>
          <label>Report Type: </label>
          <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        {loading ? <p>Loading reports...</p> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Created</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.type}</td>
                  <td>{report.created_at}</td>
                  <td>{report.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section>
        <h3>Recent Glucose (last 30 days)</h3>
        {chartLoading ? <p>Loading chart...</p> : (
          <div style={{ maxWidth: 900, marginBottom: 16 }}>
            {dailyAverages && dailyAverages.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : <p>No readings available.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;

