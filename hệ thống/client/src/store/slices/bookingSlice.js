import { createSlice } from '@reduxjs/toolkit';

                                                
const getDefaultBookingDate = () => {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
};

const initialState = {
  step: 1,                                                                                                    
  selectedDoctor: null,
  selectedDate: getDefaultBookingDate(),
  selectedSlot: '',
  patientInfo: {
    fullName: '',
    phone: '',
    email: '',
    gender: 'Nam',
    dob: '1995-01-01',
    symptoms: ''
  },
  depositAmount: 50000,
  holdingInfo: null,                                                                                                              
  confirmedBooking: null                                                     
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    selectDoctor: (state, action) => {
      state.selectedDoctor = action.payload;
      state.selectedSlot = '';                             
    },
    selectDate: (state, action) => {
      state.selectedDate = action.payload;
      state.selectedSlot = '';                           
    },
    selectSlot: (state, action) => {
      state.selectedSlot = action.payload;
    },
    setPatientInfo: (state, action) => {
      state.patientInfo = { ...state.patientInfo, ...action.payload };
    },
    setStep: (state, action) => {
      state.step = action.payload;
    },
    nextStep: (state) => {
      if (state.step < 4) state.step += 1;
    },
    prevStep: (state) => {
      if (state.step > 1) state.step -= 1;
    },
    setHoldingInfo: (state, action) => {
      state.holdingInfo = action.payload;
    },
    clearHoldingInfo: (state) => {
      state.holdingInfo = null;
    },
    setConfirmedBooking: (state, action) => {
      state.confirmedBooking = action.payload;
    },
    resetBooking: (state) => {
      return {
        ...initialState,
        selectedDate: getDefaultBookingDate()
      };
    }
  }
});

export const {
  selectDoctor,
  selectDate,
  selectSlot,
  setPatientInfo,
  setStep,
  nextStep,
  prevStep,
  setHoldingInfo,
  clearHoldingInfo,
  setConfirmedBooking,
  resetBooking
} = bookingSlice.actions;

export default bookingSlice.reducer;
