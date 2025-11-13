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
  const [staff, setStaff] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // Date object
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ patient_id: "", specialist_id: "", notes: "", start_time: "", end_time: "" });
  const [filterSpecialist, setFilterSpecialist] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);

  useEffect(() => {
    // Fetch specialists and patients
    const fetchData = async () => {
      const [specs, staffRes, pats] = await Promise.all([
        api.get("/specialists/"),
        api.get("/clinic_staff/"),
        api.get("/patients/")
      ]);
      setSpecialists(specs.data);
      setStaff(staffRes.data);
      setPatients(pats.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Fetch appointments, optionally filtered by specialist
    const fetchAppointments = async () => {
      let url = "/appointments/";
      let params = {};
  if (filterSpecialist) params.staff_id = filterSpecialist;
      const appts = await api.get(url, { params });
      setAppointments(appts.data);
    };
    fetchAppointments();
  }, [filterSpecialist]);

  // Convert appointments to calendar events (minimal title)
  const events = appointments.map(a => ({
    id: a.appointment_id,
    title: `Appt: ${a.patient_name} & ${a.specialist_name}`,
    start: new Date(a.start_time),
    end: new Date(a.end_time),
    resource: a
  }));

  const handleSelectSlot = slotInfo => {
    // slotInfo can be { start, end, slots, action }
    let slotDate = slotInfo.start || slotInfo;
    if (Array.isArray(slotInfo.slots) && slotInfo.slots.length > 0) {
      slotDate = slotInfo.slots[0];
    }
    if (!slotDate) return;
    setSelectedSlot(slotDate);
    setShowCreateForm(false);
    // Prefill form with selected date and default 40min duration
    const startISO = new Date(slotDate).toISOString().slice(0,16);
    const endISO = new Date(new Date(slotDate).getTime() + 40*60000).toISOString().slice(0,16);
    setForm(f => ({ ...f, start_time: startISO, duration: 40, end_time: endISO }));
    // Debug output
    // eslint-disable-next-line
    console.log('Slot selected:', slotInfo, 'Using date:', slotDate);
  };

  const handleBook = async e => {
    e.preventDefault();
    // Default to 1 hour slot
    const start_time = selectedSlot;
    const end_time = new Date(new Date(selectedSlot).getTime() + 60 * 60 * 1000);
    const staff_id = localStorage.getItem("staff_id");
    await api.post("/appointments/", {
      ...form,
      staff_id,
      start_time,
      end_time
    });
    setSelectedSlot(null);
    setForm({ patient_id: "", specialist_id: "", notes: "" });
    // Refresh appointments
    let params = {};
    if (filterSpecialist) params.specialist_id = filterSpecialist;
    const appts = await api.get("/appointments/", { params });
    setAppointments(appts.data);
  };

  const handleDelete = async id => {
    await api.delete(`/appointments/${id}`);
    setAppointments(appointments.filter(a => a.appointment_id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Appointments</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Filter by Specialist: </label>
        <select value={filterSpecialist} onChange={e => setFilterSpecialist(e.target.value)}>
          <option value="">All</option>
          {specialists.map(s => <option key={s.specialist_id} value={s.specialist_id}>{s.user.full_name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <button
          style={{ padding: "0.5rem 1.2rem", borderRadius: 6, border: "none", background: showCreateForm ? "#e74c3c" : "#1976d2", color: "#fff", fontWeight: 500, cursor: "pointer" }}
          onClick={() => {
            setShowCreateForm(f => !f);
            setSelectedSlot(null);
            setForm({ patient_id: "", staff_id: "", notes: "", start_time: "", end_time: "" });
          }}
        >{showCreateForm ? "Cancel" : "Create Appointment"}</button>
      </div>
      {showCreateForm && (
        <form
          onSubmit={async e => {
            e.preventDefault();
            await api.post("/appointments/", {
              ...form,
              staff_id: localStorage.getItem("staff_id"),
              start_time: form.start_time,
              end_time: form.end_time
            });
            setShowCreateForm(false);
            setSelectedSlot(null);
            setForm({ patient_id: "", staff_id: "", notes: "", start_time: "", end_time: "" });
            // Refresh appointments
            let params = {};
            if (filterSpecialist) params.specialist_id = filterSpecialist;
            const appts = await api.get("/appointments/", { params });
            setAppointments(appts.data);
          }}
          style={{ marginTop: 8, background: "#f8f8f8", padding: 16, borderRadius: 8 }}
        >
          <h4>Create Appointment</h4>
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
          <label style={{ marginLeft: 12 }}>Start Time: </label>
          <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
          <label style={{ marginLeft: 12 }}>End Time: </label>
          <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
          <label style={{ marginLeft: 12 }}>Reason: </label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: 200 }} required />
          <button type="submit" style={{ marginLeft: 12 }}>Create</button>
        </form>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable={true}
        popup
        views={['month', 'week', 'day', 'agenda']}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={event => setSelectedEvent(event.resource)}
        style={{ height: 600, margin: "40px 0" }}
      />
      {selectedEvent && !editEvent && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedEvent(null)}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <h3>Appointment Details</h3>
            <div><b>Patient:</b> {selectedEvent.patient_name}</div>
            <div><b>Specialist:</b> {selectedEvent.specialist_name}</div>
            <div><b>Start:</b> {new Date(selectedEvent.start_time).toLocaleString()}</div>
            <div><b>End:</b> {new Date(selectedEvent.end_time).toLocaleString()}</div>
            <div><b>Reason:</b> {selectedEvent.notes}</div>
            <div><b>Status:</b> {selectedEvent.status}</div>
            <button style={{ marginTop: 16, marginRight: 8 }} onClick={() => setEditEvent(selectedEvent)}>Edit</button>
            <button style={{ marginTop: 16, marginRight: 8, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px' }}
              onClick={async () => {
                await api.delete(`/appointments/${selectedEvent.appointment_id}`);
                setSelectedEvent(null);
                // Refresh appointments
                let params = {};
                if (filterSpecialist) params.specialist_id = filterSpecialist;
                const appts = await api.get("/appointments/", { params });
                setAppointments(appts.data);
              }}
            >Delete</button>
            <button style={{ marginTop: 16 }} onClick={() => setSelectedEvent(null)}>Close</button>
          </div>
        </div>
      )}
      {editEvent && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEditEvent(null)}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, minWidth: 340, maxWidth: 420, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <h3>Edit Appointment</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                await api.put(`/appointments/${editEvent.appointment_id}`, {
                  patient_id: editEvent.patient_id,
                  staff_id: editEvent.staff_id,
                  start_time: editEvent.start_time,
                  end_time: editEvent.end_time,
                  notes: editEvent.notes,
                  status: editEvent.status
                });
                setEditEvent(null);
                setSelectedEvent(null);
                // Refresh appointments
                let params = {};
                if (filterSpecialist) params.specialist_id = filterSpecialist;
                const appts = await api.get("/appointments/", { params });
                setAppointments(appts.data);
              }}
            >
              <label>Patient: </label>
              <select value={editEvent.patient_id} onChange={e => setEditEvent(ev => ({ ...ev, patient_id: e.target.value }))} required>
                <option value="">Select</option>
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.user.full_name}</option>)}
              </select>
              <label style={{ marginLeft: 12 }}>Specialist: </label>
              <select value={editEvent.staff_id} onChange={e => setEditEvent(ev => ({ ...ev, staff_id: e.target.value }))} required>
                <option value="">Select</option>
                {specialists.map(s => <option key={s.specialist_id} value={s.specialist_id}>{s.user.full_name}</option>)}
              </select>
              <label style={{ marginLeft: 12 }}>Start Time: </label>
              <input type="datetime-local" value={editEvent.start_time?.slice(0,16)} onChange={e => {
                const start = e.target.value;
                let end = editEvent.end_time;
                if (start && end && new Date(start) >= new Date(end)) {
                  end = new Date(new Date(start).getTime() + 40*60000).toISOString().slice(0,16);
                }
                setEditEvent(ev => ({ ...ev, start_time: start, end_time: end }));
              }} required />
              <label style={{ marginLeft: 12 }}>End Time: </label>
              <input type="datetime-local" value={editEvent.end_time?.slice(0,16)} onChange={e => setEditEvent(ev => ({ ...ev, end_time: e.target.value }))} required />
              <label style={{ marginLeft: 12 }}>Reason: </label>
              <input value={editEvent.notes} onChange={e => setEditEvent(ev => ({ ...ev, notes: e.target.value }))} style={{ width: 180 }} required />
              <label style={{ marginLeft: 12 }}>Status: </label>
              <select value={editEvent.status} onChange={e => setEditEvent(ev => ({ ...ev, status: e.target.value }))}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div style={{ marginTop: 16 }}>
                <button type="submit" style={{ marginRight: 8 }}>Save</button>
                <button type="button" onClick={() => setEditEvent(null)} style={{ marginRight: 8 }}>Cancel</button>
                <button type="button" style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px' }}
                  onClick={async () => {
                    await api.delete(`/appointments/${editEvent.appointment_id}`);
                    setEditEvent(null);
                    setSelectedEvent(null);
                    // Refresh appointments
                    let params = {};
                    if (filterSpecialist) params.specialist_id = filterSpecialist;
                    const appts = await api.get("/appointments/", { params });
                    setAppointments(appts.data);
                  }}
                >Delete</button>
              </div>
            </form>
          </div>
        </div>
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
