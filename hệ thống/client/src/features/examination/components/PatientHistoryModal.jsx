import React from 'react';
import Modal from '../../../components/common/Modal';
import Loader from '../../../components/common/Loader';

const PatientHistoryModal = ({ isOpen, onClose, patientName, loading, history }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lịch Sử Khám Bệnh: ${patientName || ''}`}
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <Loader text="Đang tải lịch sử bệnh án..." />
      ) : history.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Bệnh nhân chưa có lịch sử bệnh án trước đây.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((rec) => (
            <div
              key={rec._id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  Ngày khám: {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Bác sĩ: {rec.doctorId?.fullName || 'Bác sĩ phụ trách'}
                </span>
              </div>
              <div className="text-sm">
                <strong className="text-slate-800 dark:text-slate-200">Chẩn đoán: </strong>
                <span className="text-slate-700 dark:text-slate-300">{rec.diagnosis}</span>
              </div>
              <div className="text-xs text-slate-500">
                <strong>Triệu chứng: </strong> {rec.symptoms}
              </div>
              {rec.medicalHistory && (
                <div className="text-xs text-slate-500">
                  <strong>Tiền sử: </strong> {rec.medicalHistory}
                </div>
              )}
              {rec.clinicalNotes && (
                <div className="text-xs text-slate-500">
                  <strong>Ghi chú: </strong> {rec.clinicalNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default PatientHistoryModal;
