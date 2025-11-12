import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../api/api";
import { addDays } from "date-fns";

const localizer = momentLocalizer(moment);

const SpecialistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const specialistId = localStorage.getItem("specialist_id");
      if (!specialistId) return;
      const res = await api.get(`/appointments/`, { params: { specialist_id: specialistId } });
      setAppointments(res.data);
      setLoading(false);
    };
    fetchAppointments();
  }, []);

  const events = appointments.map(a => ({
    id: a.appointment_id,
    title: `Patient: ${a.patient_name}`,
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
        />
      )}
    </div>
  );
};

export default SpecialistAppointments;
