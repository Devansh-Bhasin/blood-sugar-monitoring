

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = 'https://blood-sugar-monitoring-system-3c4cc007e08e.herokuapp.com/api';

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
    console.log('Attempting to delete user:', userId);
    if (userId === undefined || userId === null || userId === "") {
      alert('Invalid user ID');
      console.error('deleteUser called with invalid userId:', userId);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setUsers(users.filter(u => u.user_id !== userId));
      console.log('User deleted:', userId);
    } catch (err) {
      alert('Failed to delete user.');
      console.error('Delete user error:', err, 'userId:', userId);
    }
  };


  const fetchReports = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date();
      let params = { period_type: type };
      if (type === 'monthly') {
        params.year = today.getFullYear();
        params.month = today.getMonth() + 1;
      } else if (type === 'yearly') {
        params.year = today.getFullYear();
      }
      const res = await axios.get(`${API_BASE_URL}/reports/generate`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setReports([res.data]);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setReports([]);
    }
    setLoading(false);
  };


  // Ref for the report section
  const reportRef = useRef();

  // Download report as PDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth * 0.95;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', (pageWidth - pdfWidth) / 2, 10, pdfWidth, pdfHeight);
    pdf.save(`admin_report_${reports[0]?.period || 'report'}.pdf`);
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', margin: '24px 0 16px' }}>Admin Dashboard</h2>
      <section style={{ background: '#f9f9f9', borderRadius: 8, padding: 20, marginBottom: 32, boxShadow: '0 2px 8px #0001' }}>
        <h3>User Management</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead style={{ background: '#e3e3e3' }}>
            <tr>
              <th style={{ padding: 8, border: '1px solid #ccc' }}>ID</th>
              <th style={{ padding: 8, border: '1px solid #ccc' }}>Name</th>
              <th style={{ padding: 8, border: '1px solid #ccc' }}>Email</th>
              <th style={{ padding: 8, border: '1px solid #ccc' }}>Role</th>
              <th style={{ padding: 8, border: '1px solid #ccc' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(user => user.role !== 'admin').map(user => (
              <tr key={user.user_id} style={{ background: '#fff' }}>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{user.user_id}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{user.full_name || user.name}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{user.email}</td>
                <td style={{ padding: 8, border: '1px solid #eee', textTransform: 'capitalize' }}>{user.role}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  <button style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }} onClick={() => deleteUser(user.user_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section style={{ background: '#f9f9f9', borderRadius: 8, padding: 20, boxShadow: '0 2px 8px #0001' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ flex: 1 }}>Reports</h3>
          <label style={{ marginRight: 8 }}>Report Type:</label>
          <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} style={{ marginRight: 16, padding: 4 }}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {reports.length > 0 && (
            <button onClick={handleDownloadPDF} style={{ background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>
              Download PDF
            </button>
          )}
        </div>
        {loading ? <p>Loading reports...</p> : (
          reports.length > 0 ? (
            <div ref={reportRef} style={{ background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px #0001' }}>
              <h4 style={{ marginBottom: 8 }}>Period: {reports[0].period}</h4>
              <p style={{ fontWeight: 500 }}>Total Active Patients: {reports[0].total_active_patients}</p>
              <h5 style={{ marginTop: 18 }}>Per-Patient Stats</h5>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, marginBottom: 16 }}>
                <thead style={{ background: '#e3e3e3' }}>
                  <tr>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Patient</th>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Avg</th>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Min</th>
                    <th style={{ padding: 6, border: '1px solid #ccc' }}>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {reports[0].patients && reports[0].patients.map((p, i) => (
                    <tr key={i}>
                      <td style={{ padding: 6, border: '1px solid #eee' }}>{p.full_name || p.patient_id}</td>
                      <td style={{ padding: 6, border: '1px solid #eee' }}>{p.avg}</td>
                      <td style={{ padding: 6, border: '1px solid #eee' }}>{p.min}</td>
                      <td style={{ padding: 6, border: '1px solid #eee' }}>{p.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h5 style={{ marginTop: 18 }}>Top Food Triggers</h5>
              <ul style={{ marginBottom: 12 }}>
                {reports[0].top_food_triggers && reports[0].top_food_triggers.map(([food, count], i) => (
                  <li key={i}>{food}: {count}</li>
                ))}
              </ul>
              <h5 style={{ marginTop: 18 }}>Top Activity Triggers</h5>
              <ul>
                {reports[0].top_activity_triggers && reports[0].top_activity_triggers.map(([activity, count], i) => (
                  <li key={i}>{activity}: {count}</li>
                ))}
              </ul>
            </div>
          ) : <p>No report data available.</p>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
