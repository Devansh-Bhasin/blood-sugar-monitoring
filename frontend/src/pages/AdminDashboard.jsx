import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://blood-sugar-monitoring.onrender.com';

function AdminDashboard() {
  const navigate = window.reactRouterNavigate || ((path) => { window.location.href = path; });
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, []);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchReports(selectedReportType);
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

  const fetchReports = async (type) => {
    setLoading(true);
    try {
  const res = await axios.get(`${API_BASE_URL}/reports/${type}`, { withCredentials: true });
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard</h2>
      <section>
        <h3>User Management</h3>
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
    </div>
  );
}

export default AdminDashboard;
