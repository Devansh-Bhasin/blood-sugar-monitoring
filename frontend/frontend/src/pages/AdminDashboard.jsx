import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = 'https://blood-sugar-monitoring-system-3c4cc007e08e.herokuapp.com/api';

function AdminDashboard() {
    // Admin-only: Create Staff/Specialist
    const [newStaff, setNewStaff] = useState({ email: '', password: '', full_name: '', phone: '', profile_image: '' });
    const [newSpecialist, setNewSpecialist] = useState({ email: '', password: '', full_name: '', phone: '', profile_image: '' });
    const [createError, setCreateError] = useState('');
    const handleCreateStaff = async (e) => {
      e.preventDefault();
      setCreateError('');
      try {
        const token = localStorage.getItem('token');
        const staffData = { user: { ...newStaff, role: 'clinic_staff' } };
        await axios.post(`${API_BASE_URL}/clinic_staff/`, staffData, { headers: { Authorization: `Bearer ${token}` } });
        alert('Staff account created successfully');
        setNewStaff({ email: '', password: '', full_name: '', phone: '', profile_image: '' });
        fetchUsers();
      } catch (err) {
        setCreateError(err.response?.data?.detail || 'Failed to create staff account');
      }
    };
    const handleCreateSpecialist = async (e) => {
      e.preventDefault();
      setCreateError('');
      try {
        const token = localStorage.getItem('token');
        const specialistData = { user: { ...newSpecialist, role: 'specialist' }, specialist_code: '' };
        await axios.post(`${API_BASE_URL}/specialists/`, specialistData, { headers: { Authorization: `Bearer ${token}` } });
        alert('Specialist account created successfully');
        setNewSpecialist({ email: '', password: '', full_name: '', phone: '', profile_image: '' });
        fetchUsers();
      } catch (err) {
        setCreateError(err.response?.data?.detail || 'Failed to create specialist account');
      }
    };
  const navigate = window.reactRouterNavigate || ((path) => { window.location.href = path; });
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    // Check if user is admin
    axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.data || res.data.role.toLowerCase() !== "admin") {
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
    // Do not auto-fetch reports on dropdown change; wait for button click
  }, []);

  const fetchUsers = async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/users/`, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      setError("Failed to fetch users. Please try again later.");
      setUsers([]);
      console.error('Error fetching users:', err);
    }
  };


  const deleteUser = async (userId) => {
    setError("");
    if (userId === undefined || userId === null || userId === "") {
      setError('Invalid user ID');
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
    } catch (err) {
      setError('Failed to delete user.');
      console.error('Delete user error:', err, 'userId:', userId);
    }
  };


  const fetchReports = async (type, year, month) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      let params = { period_type: type };
      if (type === 'monthly') {
        params.year = year;
        params.month = month;
      } else if (type === 'yearly') {
        params.year = year;
      }
      const res = await axios.get(`${API_BASE_URL}/reports/generate`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setReports([res.data]);
    } catch (err) {
      setError("Failed to fetch reports. Please try again later.");
      setReports([]);
      console.error('Error fetching reports:', err);
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

  // Print report
  const handlePrint = () => {
    if (!reportRef.current) return;
    const printContents = reportRef.current.innerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Report</title>');
    win.document.write('</head><body >');
    win.document.write(printContents);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  if (!isAdmin) {
    return <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', color: '#c00', fontSize: 20 }}><b>Access denied.</b> Admins only.</div>;
  }
  // Handler for manual report generation
  const handleGenerateReport = () => {
    if (selectedReportType === 'monthly') {
      fetchReports('monthly', selectedYear, selectedMonth);
    } else if (selectedReportType === 'yearly') {
      fetchReports('yearly', selectedYear);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: 1000, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', margin: '24px 0 16px' }}>Admin Dashboard</h2>
      {error && <div style={{ color: '#c00', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
      <section style={{ background: '#f9f9f9', borderRadius: 8, padding: 20, marginBottom: 32, boxShadow: '0 2px 8px #0001' }}>
              {/* Admin-only: Create Staff/Specialist Section */}
              <section style={{ background: '#f9f9f9', borderRadius: 8, padding: 20, marginBottom: 32, boxShadow: '0 2px 8px #0001' }}>
                <h3>Create Staff Account</h3>
                <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <input type="email" placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} required style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="password" placeholder="Password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} required style={{ flex: '1 1 120px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Full Name" value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} required style={{ flex: '1 1 120px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Phone" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} style={{ flex: '1 1 120px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Profile Image URL" value={newStaff.profile_image} onChange={e => setNewStaff({ ...newStaff, profile_image: e.target.value })} style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Create Staff</button>
                </form>
                <h3>Create Specialist Account</h3>
                <form onSubmit={handleCreateSpecialist} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <input type="email" placeholder="Email" value={newSpecialist.email} onChange={e => setNewSpecialist({ ...newSpecialist, email: e.target.value })} required style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="password" placeholder="Password" value={newSpecialist.password} onChange={e => setNewSpecialist({ ...newSpecialist, password: e.target.value })} required style={{ flex: '1 1 120px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Full Name" value={newSpecialist.full_name} onChange={e => setNewSpecialist({ ...newSpecialist, full_name: e.target.value })} required style={{ flex: '1 1 120px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Phone" value={newSpecialist.phone} onChange={e => setNewSpecialist({ ...newSpecialist, phone: e.target.value })} style={{ flex: '1 1 120px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <input type="text" placeholder="Profile Image URL" value={newSpecialist.profile_image} onChange={e => setNewSpecialist({ ...newSpecialist, profile_image: e.target.value })} style={{ flex: '1 1 180px', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
                  <button type="submit" style={{ background: '#8e44ad', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Create Specialist</button>
                </form>
                {createError && <div style={{ color: '#d32f2f', marginTop: 8, fontWeight: 500 }}>{createError}</div>}
              </section>
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
        <h3>Reports</h3>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <label style={{ marginRight: 8 }}>Report Type:</label>
          <select value={selectedReportType} onChange={e => setSelectedReportType(e.target.value)} style={{ marginRight: 16, padding: 4 }}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {selectedReportType === 'monthly' && (
            <>
              <label style={{ marginRight: 8 }}>Month:</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ marginRight: 8, padding: 4 }}>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <label style={{ marginRight: 8 }}>Year:</label>
              <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: 80, marginRight: 8, padding: 4 }} min="2000" max={new Date().getFullYear()} />
            </>
          )}
          {selectedReportType === 'yearly' && (
            <>
              <label style={{ marginRight: 8 }}>Year:</label>
              <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: 80, marginRight: 8, padding: 4 }} min="2000" max={new Date().getFullYear()} />
            </>
          )}
          <button onClick={handleGenerateReport} style={{ background: '#8e44ad', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', marginRight: 8 }}>
            Generate Report
          </button>
        </div>
        {loading ? <p>Loading reports...</p> : (
          reports.length > 0 ? (
            <>
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
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button onClick={handleDownloadPDF} style={{ background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>
                  Download PDF
                </button>
                <button onClick={handlePrint} style={{ background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>
                  Print
                </button>
              </div>
            </>
          ) : <p>No report data available.</p>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
