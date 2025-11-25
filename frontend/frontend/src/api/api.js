// Delete user (admin only)
export const deleteUserById = async (userId, token) => {
  return await API.delete(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  });
};

// Fetch admin report (monthly/yearly)
export const fetchAdminReport = async (type, year, month, token) => {
  let params = { period_type: type, year };
  if (type === 'monthly') params.month = month;
  const res = await API.get('/reports/generate', {
    params,
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  });
  return res.data;
};
// Specialist-patient assignment management
export const assignSpecialistToPatient = async (specialist_id, patient_id) => {
  return await API.post("/specialist_patient/assign", { specialist_id, patient_id });
};

export const unassignSpecialistFromPatient = async (specialist_id, patient_id) => {
  return await API.post("/specialist_patient/unassign", { specialist_id, patient_id });
};

export const getSpecialistsForPatient = async (patient_id) => {
  const response = await API.get(`/specialist_patient/patient/${patient_id}`);
  return response.data;
};

export const getPatientsForSpecialist = async (specialist_id) => {
  const response = await API.get(`/specialist_patient/specialist/${specialist_id}`);
  return response.data;
};
import axios from "axios";

// Set base URL for backend
const API = axios.create({
  baseURL: "https://blood-sugar-monitoring-system-3c4cc007e08e.herokuapp.com/api"
});

// Example: get all patients
export const getPatients = async () => {
  const response = await API.get("/patients/");
  return response.data;
};

// Example: create a new patient
export const createPatient = async (patientData) => {
  const response = await API.post("/patients/", patientData);
  return response.data;
};

// Example: get all readings
export const getReadings = async () => {
  const response = await API.get("/readings/");
  return response.data;
};

// Example: create a new reading
export const createReading = async (readingData) => {
  const response = await API.post("/readings/", readingData);
  return response.data;
};

// Also export the axios instance as default so modules can do `import api from '../api/api'`
export default API;
