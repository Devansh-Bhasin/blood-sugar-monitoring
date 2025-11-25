import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../api/api";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment);

const SpecialistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const specialistId = localStorage.getItem("specialist_id");
    if (!token || !specialistId) {
      navigate("/login");
      return;
    }
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/appointments/`, { params: { specialist_id: specialistId }, headers: { Authorization: `Bearer ${token}` } });
        setAppointments(res.data);
      } catch (err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate("/login");
        } else {
          console.error(err);
        }
      }
      setLoading(false);
    };
    fetchAppointments();
  }, [navigate]);

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
