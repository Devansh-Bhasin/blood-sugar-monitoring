import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../api/api";

const localizer = momentLocalizer(moment);

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const patientId = localStorage.getItem("patient_id");
      if (!patientId) return;
      const res = await api.get(`/appointments/`, { params: { patient_id: patientId } });
      setAppointments(res.data);
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  const events = appointments.map(a => ({
    id: a.appointment_id,
    title: `Specialist: ${a.specialist_name}`,
    start: new Date(a.start_time),
    end: new Date(a.end_time),
    resource: a
  }));

  return (
    <div style={{ padding: 24 }}>
      <h2>My Appointments</h2>
      {loading ? <p>Loading...</p> : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, margin: "40px 0" }}
          onSelectEvent={event => setSelectedEvent(event.resource)}
        />
      )}
      {selectedEvent && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedEvent(null)}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <h3>Appointment Details</h3>
            <div><b>Specialist:</b> {selectedEvent.specialist_name}</div>
            <div><b>Start:</b> {new Date(selectedEvent.start_time).toLocaleString()}</div>
            <div><b>End:</b> {new Date(selectedEvent.end_time).toLocaleString()}</div>
            <div><b>Reason:</b> {selectedEvent.reason}</div>
            <div><b>Status:</b> {selectedEvent.status}</div>
            <button style={{ marginTop: 16 }} onClick={() => setSelectedEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
