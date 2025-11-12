import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { addDays } from "date-fns";
import api from "../api/api";

const localizer = momentLocalizer(moment);

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ patient_id: "", specialist_id: "", notes: "" });

  useEffect(() => {
    // Fetch all appointments, specialists, and patients
    const fetchData = async () => {
      const [appts, specs, pats] = await Promise.all([
        api.get("/appointments/"),
        api.get("/specialists/"),
        api.get("/patients/")
      ]);
      setAppointments(appts.data);
      setSpecialists(specs.data);
      setPatients(pats.data);
    };
    fetchData();
  }, []);

  // Convert appointments to calendar events
  const events = appointments.map(a => ({
    id: a.appointment_id,
    title: `Patient: ${a.patient_name} | Specialist: ${a.specialist_name}`,
    start: new Date(a.datetime),
    end: addDays(new Date(a.datetime), 0.04), // 1 hour slot
    resource: a
  }));

  const handleSelectSlot = slotInfo => {
    setSelectedSlot(slotInfo.start);
  };

  const handleBook = async e => {
    e.preventDefault();
    await api.post("/appointments/", {
      ...form,
      datetime: selectedSlot
    });
    setSelectedSlot(null);
    setForm({ patient_id: "", specialist_id: "", notes: "" });
    // Refresh appointments
    const appts = await api.get("/appointments/");
    setAppointments(appts.data);
  };

  const handleDelete = async id => {
    await api.delete(`/appointments/${id}`);
    setAppointments(appointments.filter(a => a.appointment_id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Appointments</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        style={{ height: 600, margin: "40px 0" }}
      />
      {selectedSlot && (
        <form onSubmit={handleBook} style={{ marginTop: 24, background: "#f8f8f8", padding: 16, borderRadius: 8 }}>
          <h4>Book Appointment</h4>
          <label>Patient: </label>
          <select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required>
            <option value="">Select</option>
            {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.user.full_name}</option>)}
          </select>
          <label style={{ marginLeft: 12 }}>Specialist: </label>
          <select value={form.specialist_id} onChange={e => setForm(f => ({ ...f, specialist_id: e.target.value }))} required>
            <option value="">Select</option>
            {specialists.map(s => <option key={s.specialist_id} value={s.specialist_id}>{s.user.full_name}</option>)}
          </select>
          <label style={{ marginLeft: 12 }}>Notes: </label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: 200 }} />
          <button type="submit" style={{ marginLeft: 12 }}>Book</button>
          <button type="button" onClick={() => setSelectedSlot(null)} style={{ marginLeft: 8 }}>Cancel</button>
        </form>
      )}
      <h3>All Appointments</h3>
      <ul>
        {appointments.map(a => (
          <li key={a.appointment_id}>
            {a.datetime} | Patient: {a.patient_name} | Specialist: {a.specialist_name}
            <button onClick={() => handleDelete(a.appointment_id)} style={{ marginLeft: 12 }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StaffAppointments;
