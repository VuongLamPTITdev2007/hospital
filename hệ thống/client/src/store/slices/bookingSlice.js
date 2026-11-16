import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedDoctor: null,
  selectedDate: '',
  selectedSlot: '',
  patientInfo: {
    fullName: '',
    phone: '',
    symptoms: ''
  },
  depositAmount: 50000,
  step: 1 // 1: Chọn bác sĩ & slot, 2: Nhập thông tin, 3: Xác nhận & Đếm ngược
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    selectDoctor: (state, action) => {
      state.selectedDoctor = action.payload;
    },
    selectSlot: (state, action) => {
      state.selectedDate = action.payload.date;
      state.selectedSlot = action.payload.timeSlot;
    },
    setPatientInfo: (state, action) => {
      state.patientInfo = { ...state.patientInfo, ...action.payload };
    },
    nextStep: (state) => {
      state.step += 1;
    },
    prevStep: (state) => {
      if (state.step > 1) state.step -= 1;
    },
    resetBooking: () => initialState
  }
});

export const { selectDoctor, selectSlot, setPatientInfo, nextStep, prevStep, resetBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
