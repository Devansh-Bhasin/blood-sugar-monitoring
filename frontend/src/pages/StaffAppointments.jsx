import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { addDays } from "date-fns";
import api from "../api/api";

const localizer = momentLocalizer(moment);

const StaffAppointments = () => {
	const navigate = useNavigate();
	const [appointments, setAppointments] = useState([]);
	const [specialists, setSpecialists] = useState([]);
	const [patients, setPatients] = useState([]);
<<<<<<< HEAD
	const [selectedSlot, setSelectedSlot] = useState(null);
	const [form, setForm] = useState({ patient_id: "", staff_id: "", notes: "" });
	const [filterSpecialist, setFilterSpecialist] = useState("");


	useEffect(() => {
		// Check staff_id and token
		const staffId = localStorage.getItem("staff_id");
		const token = localStorage.getItem("token");
		if (!staffId || !token) {
			navigate("/login");
			return;
		}
		// Fetch specialists and patients
		const fetchData = async () => {
			const [specs, pats] = await Promise.all([
				api.get("/specialists/"),
				api.get("/patients/")
			]);
			setSpecialists(specs.data);
			setPatients(pats.data);
		};
		fetchData();
		// Set staff_id in form by default
		setForm(f => ({ ...f, staff_id: staffId }));
	}, [navigate]);
=======
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({ patient_id: "", specialist_id: "", start_time: "", end_time: "", reason: "" });
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [editMode, setEditMode] = useState(false);
	const [notification, setNotification] = useState("");
	const [filterSpecialist, setFilterSpecialist] = useState("");

// Get staff_id from localStorage
const staffId = localStorage.getItem("staff_id");


	 useEffect(() => {
		 // Check staff_id and token
		 const staffId = localStorage.getItem("staff_id");
		 const token = localStorage.getItem("token");
		 if (!staffId || !token) {
			 navigate("/login");
			 return;
		 }
		 // Fetch specialists and patients
		 const fetchData = async () => {
			 const [specs, pats] = await Promise.all([
				 api.get("/specialists/"),
				 api.get("/patients/")
			 ]);
			 setSpecialists(specs.data);
			 setPatients(pats.data);
		 };
		 fetchData();
		 // Set staff_id in form by default (not needed in form state, will use directly)
	 }, [navigate]);
>>>>>>> 4c61778ee2786bffdb2f4e4607f72b83f42e28b5

	useEffect(() => {
		// Fetch appointments, optionally filtered by specialist
		const staffId = localStorage.getItem("staff_id");
		const token = localStorage.getItem("token");
		if (!staffId || !token) {
			navigate("/login");
			return;
		}
		const fetchAppointments = async () => {
			let url = "/appointments/";
			let params = {};
			if (filterSpecialist) params.staff_id = filterSpecialist;
			const appts = await api.get(url, { params, headers: { Authorization: `Bearer ${token}` } });
			setAppointments(appts.data);
		};
		fetchAppointments();
	}, [filterSpecialist, navigate]);

	// Convert appointments to calendar events
	const events = appointments.map(a => ({
		id: a.appointment_id,
		title: `Patient: ${a.patient_name} | Specialist: ${a.specialist_name}`,
		start: new Date(a.start_time),
		end: new Date(a.end_time),
		resource: a
	}));

<<<<<<< HEAD
	const handleSelectSlot = slotInfo => {
		setSelectedSlot(slotInfo.start);
	};

	const handleBook = async e => {
		e.preventDefault();
		// Default to 1 hour slot
		const start_time = selectedSlot;
		const end_time = new Date(new Date(selectedSlot).getTime() + 60 * 60 * 1000);

		// Check for conflict: same staff, overlapping time
		const conflict = appointments.some(a => {
			return (
				String(a.staff_id) === String(form.staff_id) &&
				((new Date(a.start_time).getTime() === new Date(start_time).getTime()) ||
				 (new Date(a.end_time).getTime() > new Date(start_time).getTime() && new Date(a.start_time).getTime() < new Date(end_time).getTime()))
			);
		});
		if (conflict) {
			alert("Select a different time: This staff already has an appointment at the selected time.");
			return;
		}

		await api.post("/appointments/", {
			...form,
			start_time,
			end_time
		});
		setSelectedSlot(null);
		setForm({ patient_id: "", staff_id: "", notes: "" });
		// Refresh appointments
		let params = {};
		if (filterSpecialist) params.staff_id = filterSpecialist;
		const appts = await api.get("/appointments/", { params });
		setAppointments(appts.data);
	};

	const handleDelete = async id => {
		await api.delete(`/appointments/${id}`);
		setAppointments(appointments.filter(a => a.appointment_id !== id));
	};
=======
	 const handleCreateButton = () => {
		 setShowForm(true);
		 setEditMode(false);
		 setForm({ patient_id: "", specialist_id: "", start_time: "", end_time: "", reason: "" });
		 setNotification("");
	 };

	 const handleBook = async e => {
		 e.preventDefault();
		 setNotification("");
		 const { start_time, end_time, patient_id, specialist_id, reason } = form;
		 if (!start_time || !end_time) {
			 setNotification("Please select both start and end date/time.");
			 return;
		 }
		 const start = new Date(start_time);
		 const end = new Date(end_time);
		 if (end <= start) {
			 setNotification("End time must be after start time.");
			 return;
		 }
		 // Check for conflict: same staff, overlapping time
		 const conflict = appointments.some(a => {
			 if (editMode && selectedEvent && a.appointment_id === selectedEvent.appointment_id) return false;
			 return (
				 String(a.staff_id) === String(staffId) &&
				 ((new Date(a.start_time) < end && new Date(a.end_time) > start))
			 );
		 });
		 if (conflict) {
			 setNotification("Conflict: This staff already has an appointment at the selected time.");
			 return;
		 }
		 // Convert to ISO strings
		 const payload = {
			 patient_id,
			 staff_id: Number(staffId),
			 specialist_id: Number(specialist_id),
			 start_time: new Date(start_time).toISOString(),
			 end_time: new Date(end_time).toISOString(),
			 reason
		 };
		 if (editMode && selectedEvent) {
			 await api.put(`/appointments/${selectedEvent.appointment_id}`, payload);
		 } else {
			 await api.post("/appointments/", payload);
		 }
		 setShowForm(false);
		 setEditMode(false);
		 setSelectedEvent(null);
		 setForm({ patient_id: "", specialist_id: "", start_time: "", end_time: "", reason: "" });
		 // Refresh appointments
		 let params = {};
		 if (filterSpecialist) params.staff_id = filterSpecialist;
		 const appts = await api.get("/appointments/", { params });
		 setAppointments(appts.data);
	 };

	 const handleDelete = async id => {
		 await api.delete(`/appointments/${id}`);
		 setAppointments(appointments.filter(a => a.appointment_id !== id));
		 setSelectedEvent(null);
	 };

	 const handleSelectEvent = event => {
		 setSelectedEvent(event.resource);
	 };

	 const handleEdit = () => {
		 if (!selectedEvent) return;
		 setShowForm(true);
		 setEditMode(true);
		 setForm({
			 patient_id: selectedEvent.patient_id,
			 specialist_id: selectedEvent.specialist_id,
			 start_time: selectedEvent.start_time ? new Date(selectedEvent.start_time).toISOString().slice(0,16) : "",
			 end_time: selectedEvent.end_time ? new Date(selectedEvent.end_time).toISOString().slice(0,16) : "",
			 reason: selectedEvent.reason || ""
		 });
	 };
>>>>>>> 4c61778ee2786bffdb2f4e4607f72b83f42e28b5

	return (
		<div style={{ padding: 24 }}>
			<h2>Manage Appointments</h2>
			<div style={{ marginBottom: 16 }}>
<<<<<<< HEAD
				<label>Filter by Specialist: </label>
				<select value={filterSpecialist} onChange={e => setFilterSpecialist(e.target.value)}>
					<option value="">All</option>
					{specialists.map(s => <option key={s.specialist_id} value={s.specialist_id}>{s.user.full_name}</option>)}
				</select>
			</div>
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
					<label style={{ marginLeft: 12 }}>Staff: </label>
					<select value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))} required>
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
=======
				<button onClick={handleCreateButton} style={{ padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, fontWeight: 600 }}>Create Appointment</button>
			</div>
			{notification && (
				<div style={{ color: 'red', marginBottom: 12 }}>{notification}</div>
			)}
			 {showForm && (
				 <form onSubmit={handleBook} style={{ marginTop: 8, background: "#f8f8f8", padding: 16, borderRadius: 8, maxWidth: 500 }}>
					 <h4>{editMode ? "Edit" : "Book"} Appointment</h4>
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
					 <br />
					 <label style={{ marginTop: 12, display: 'inline-block' }}>Start Date/Time: </label>
					 <input
						 type="datetime-local"
						 value={form.start_time}
						 onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
						 required
						 style={{ marginRight: 12 }}
					 />
					 <label style={{ marginLeft: 0 }}>End Date/Time: </label>
					 <input
						 type="datetime-local"
						 value={form.end_time}
						 onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
						 required
						 style={{ marginRight: 12 }}
					 />
					 <br />
					 <label style={{ marginTop: 12 }}>Reason: </label>
					 <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ width: 200 }} />
					 <br />
					 <button type="submit" style={{ marginTop: 12 }}>{editMode ? "Save Changes" : "Create Appointment"}</button>
					 <button type="button" onClick={() => { setShowForm(false); setNotification(""); setEditMode(false); setSelectedEvent(null); }} style={{ marginLeft: 8 }}>Cancel</button>
				 </form>
			 )}
			<div style={{ marginBottom: 16, color: '#555', fontSize: 16 }}>
				<strong>Instructions:</strong> Use the button above to create an appointment. The calendar below shows all appointments.
			</div>
			 <Calendar
				 localizer={localizer}
				 events={events}
				 startAccessor="start"
				 endAccessor="end"
				 style={{ height: 600, margin: "40px 0" }}
				 onSelectEvent={handleSelectEvent}
			 />

			 {/* Appointment Details Modal */}
			 {selectedEvent && !showForm && (
				 <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
					 <div style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 350, maxWidth: 500 }}>
						 <h3>Appointment Details</h3>
						 <div><b>Patient:</b> {selectedEvent.patient_name}</div>
						 <div><b>Specialist:</b> {selectedEvent.specialist_name}</div>
						 <div><b>Start:</b> {selectedEvent.start_time ? new Date(selectedEvent.start_time).toLocaleString() : ''}</div>
						 <div><b>End:</b> {selectedEvent.end_time ? new Date(selectedEvent.end_time).toLocaleString() : ''}</div>
						 <div><b>Reason:</b> {selectedEvent.reason || '-'}</div>
						 <div style={{ marginTop: 16 }}>
							 <button onClick={handleEdit} style={{ marginRight: 12 }}>Edit</button>
							 <button onClick={() => handleDelete(selectedEvent.appointment_id)} style={{ marginRight: 12, color: 'red' }}>Delete</button>
							 <button onClick={() => setSelectedEvent(null)}>Close</button>
						 </div>
					 </div>
				 </div>
			 )}
>>>>>>> 4c61778ee2786bffdb2f4e4607f72b83f42e28b5
		</div>
	);
};

export default StaffAppointments;
