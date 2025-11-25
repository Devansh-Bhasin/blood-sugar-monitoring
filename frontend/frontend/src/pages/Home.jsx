import React, { useEffect, useState } from "react";
import { getPatients } from "../api/api";

const Home = () => {
  const [patients, setPatients] = useState([]);

  // Fetch patients when the component mounts
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data); // store data in state
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div>
      <h1>Patients List</h1>
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.name} - {p.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
