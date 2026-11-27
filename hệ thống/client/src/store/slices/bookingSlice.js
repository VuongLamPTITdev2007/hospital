import { createSlice } from '@reduxjs/toolkit';

// Lấy chuỗi ngày YYYY-MM-DD theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
export const getVietnamDateString = (offsetDays = 0) => {
  const vnTodayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (offsetDays === 0) return vnTodayStr;
  const target = new Date(`${vnTodayStr}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + offsetDays);
  return target.toISOString().slice(0, 10);
};

// Mặc định chọn ngày mai theo giờ Việt Nam để thuận tiện đặt lịch
const getDefaultBookingDate = () => getVietnamDateString(1);

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
      const payload = action.payload;
      if (!payload) {
        state.selectedDoctor = null;
        state.selectedSlot = '';
        return;
      }
      // Chuẩn hóa thông tin bác sĩ để tương thích giữa DoctorList/DoctorDetail (DoctorProfile) và BookingPage
      const normalizedId = payload.doctorId || payload.userId?._id || payload.userId || payload.id || payload._id;
      state.selectedDoctor = {
        ...payload,
        id: normalizedId,
        doctorId: normalizedId,
        doctorProfileId: payload.doctorProfileId || payload._id,
        name: payload.name || payload.userId?.fullName || 'Bác sĩ MedCare',
        specialty: payload.specialty || payload.specialtyId?.name || 'Đa khoa',
        avatar: payload.avatar || payload.userId?.avatar,
        fee: payload.fee ?? payload.consultationFee ?? 350000
      };
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
