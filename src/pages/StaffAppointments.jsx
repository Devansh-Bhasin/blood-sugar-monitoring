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
	const [form, setForm] = useState({ patient_id: "", staff_id: "", notes: "" });
	const [filterSpecialist, setFilterSpecialist] = useState("");

	useEffect(() => {
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

	// Convert appointments to calendar events
	const events = appointments.map(a => ({
		id: a.appointment_id,
		title: `Patient: ${a.patient_name} | Specialist: ${a.specialist_name}`,
		start: new Date(a.start_time),
		end: new Date(a.end_time),
		resource: a
	}));

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
		</div>
	);
};

export default StaffAppointments;
