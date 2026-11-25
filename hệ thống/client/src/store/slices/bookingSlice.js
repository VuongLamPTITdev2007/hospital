import { createSlice } from '@reduxjs/toolkit';

// Mặc định chọn ngày mai để thuận tiện đặt lịch
const getDefaultBookingDate = () => {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
};

const initialState = {
  step: 1, // 1: Chọn bác sĩ & khung giờ -> 2: Thông tin bệnh nhân -> 3: Giữ chỗ & Cọc VietQR -> 4: Thành công
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
  holdingInfo: null, // Lưu thông tin phiên giữ chỗ: { appointmentId, bookingCode, holdingExpiresAt, secondsRemaining, vietQrUrl }
  confirmedBooking: null // Dữ liệu phiếu hẹn sau khi xác nhận cọc thành công
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    selectDoctor: (state, action) => {
      state.selectedDoctor = action.payload;
      state.selectedSlot = ''; // Reset slot khi đổi bác sĩ
    },
    selectDate: (state, action) => {
      state.selectedDate = action.payload;
      state.selectedSlot = ''; // Reset slot khi đổi ngày
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
