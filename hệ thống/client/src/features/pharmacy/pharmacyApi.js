import axiosClient from '../../api/axiosClient';

export const fetchMedicines = (params = {}) => {
  return axiosClient.get('/medicines', { params });
};

export const createMedicine = (payload) => {
  return axiosClient.post('/medicines', payload);
};

export const updateMedicine = (id, payload) => {
  return axiosClient.put(`/medicines/${id}`, payload);
};

export const deleteMedicine = (id) => {
  return axiosClient.delete(`/medicines/${id}`);
};

export const fetchPrescriptions = (params = {}) => {
  return axiosClient.get('/prescriptions', { params });
};

export const fetchPatients = () => {
  return axiosClient.get('/prescriptions/patients');
};

export const fetchPatientMedicalRecords = (patientId) => {
  return axiosClient.get(`/records/patient/${patientId}`);
};

export const createPrescription = (payload) => {
  return axiosClient.post('/prescriptions', payload);
};

export const dispensePrescription = (id) => {
  return axiosClient.patch(`/prescriptions/${id}/dispense`);
};
