# Instructions for AI Agents Working on MedCare

This repository is a full-stack web application for university course evaluation.

## Roles & Feature Directory Mapping:
- **TV 1 (Leader):** Doctor & Specialty discovery (`client/src/features/doctors/`, `server/controllers/doctorController.js`, `server/models/DoctorProfile.js`)
- **TV 2:** Booking Engine & Countdown hold (`client/src/features/booking/`, `server/controllers/appointmentController.js`, `server/models/Appointment.js`)
- **TV 3:** Doctor Examination & EHR (`client/src/features/examination/`, `server/controllers/medicalRecordController.js`, `server/models/MedicalRecord.js`)
- **TV 4:** Pharmacy & Prescription (`client/src/features/pharmacy/`, `server/controllers/medicineController.js`, `server/models/Medicine.js`, `server/models/Prescription.js`)
- **TV 5:** Q&A Community & Reviews (`client/src/features/community/`, `server/controllers/communityController.js`, `server/models/Discussion.js`, `server/models/Review.js`)
- **TV 6:** Admin & Analytics (`client/src/features/admin/`, `server/controllers/adminController.js`, Aggregation pipelines)

## Crucial Shared Utilities:
- Client API client: `client/src/api/axiosClient.js`
- Custom Hooks: `client/src/hooks/useCountdown.js`, `client/src/hooks/useDebounce.js`, `client/src/hooks/useFetch.js`
- Auth Context: `client/src/context/AuthContext.jsx`
- Backend Auth Middleware: `server/middlewares/auth.js` (provides `verifyToken`, `authorizeRoles`)
- Backend Error Middleware: `server/middlewares/errorHandler.js`

When editing code, never break common contracts and explain key React/Node concepts to help students defend their work.
