// Attach Authorization header with JWT for all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
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
// Helper to decode JWT and extract user_id
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getCurrentStaffId() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const payload = parseJwt(token);
  // Only return user_id if role is staff
  if (payload && (payload.role === "staff" || payload.role === "admin")) {
    return payload.user_id;
  }
  return null;
}


// Set base URL for backend (Heroku)
const API = axios.create({
  baseURL: "https://blood-sugar-monitoring-system-3c4cc007e08e.herokuapp.com/api",
  withCredentials: true,
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
