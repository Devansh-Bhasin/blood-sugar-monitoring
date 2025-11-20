import React, { useEffect, useState } from "react";
import api from "../api/api";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/patients/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlerts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Alerts</h2>
      {alerts.map((a) => (
        <div key={a.id} style={{ border: "1px solid red", margin: "1rem", padding: "1rem" }}>
          <p>{a.message}</p>
          <p>Date: {a.date}</p>
        </div>
      ))}
    </div>
  );
};

export default Alerts;
