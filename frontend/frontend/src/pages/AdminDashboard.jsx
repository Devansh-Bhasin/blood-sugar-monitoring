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
  const [reportData, setReportData] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dailyAverages, setDailyAverages] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAdminSummary();
    fetchDailyAverages(30);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedReportType, selectedYear, selectedMonth]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/`, { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const deleteUser = async (userId) => {
    if (!userId) {
      alert('Invalid user ID.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE_URL}/users/${userId}`, { headers });
      setUsers(users.filter(u => u.user_id !== userId));
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


  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let params = `period_type=${selectedReportType}&year=${selectedYear}`;
      if (selectedReportType === 'monthly') params += `&month=${selectedMonth}`;
      const res = await axios.get(`${API_BASE_URL}/reports/generate?${params}`, { headers });
      setReportData(res.data);
    } catch (err) {
      setReportData(null);
      console.error('Error fetching report data:', err);
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
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => deleteUser(user.user_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Generate Report</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label>Type:</label>
          <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <label>Year:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {selectedReportType === 'monthly' && (
            <>
              <label>Month:</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </>
          )}
        </div>
        {loading ? <p>Loading report...</p> : reportData ? (
          <div style={{ marginBottom: 24 }}>
            <h4>Report for {reportData.period} ({reportData.period_start} to {reportData.period_end})</h4>
            <div style={{ marginBottom: 12 }}>
              <b>Total Active Patients:</b> {reportData.total_active_patients}
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>Top Food Triggers:</b> {reportData.top_food_triggers && reportData.top_food_triggers.length > 0 ? (
                <ul>{reportData.top_food_triggers.map(([food, count]) => <li key={food}>{food} ({count})</li>)}</ul>
              ) : 'None'}
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>Top Activity Triggers:</b> {reportData.top_activity_triggers && reportData.top_activity_triggers.length > 0 ? (
                <ul>{reportData.top_activity_triggers.map(([act, count]) => <li key={act}>{act} ({count})</li>)}</ul>
              ) : 'None'}
            </div>
            <div>
              <b>Patient Statistics:</b>
              <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th>Patient</th>
                    <th>Average</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.patients && reportData.patients.length > 0 ? reportData.patients.map(p => (
                    <tr key={p.patient_id}>
                      <td>{p.full_name || p.patient_id}</td>
                      <td>{p.avg && !isNaN(p.avg) ? p.avg.toFixed(2) : '-'}</td>
                      <td>{p.min && !isNaN(p.min) ? p.min.toFixed(2) : '-'}</td>
                      <td>{p.max && !isNaN(p.max) ? p.max.toFixed(2) : '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : <p>No report data available.</p>}
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

