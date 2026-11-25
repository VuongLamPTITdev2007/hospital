import React from 'react';
import { Printer, X } from 'lucide-react';
import Button from '../../../components/common/Button';

const PrintablePrescription = ({ prescription, onClose }) => {
  if (!prescription) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:static print:bg-white print:p-0">
      <div className="w-full max-w-2xl bg-white text-black rounded-lg shadow-xl overflow-hidden print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-b border-gray-300 print:hidden">
          <span className="text-sm font-semibold">Xem trước đơn thuốc</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> In đơn
            </Button>
            <button onClick={onClose} className="p-1 text-gray-600 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-4 max-h-[80vh] overflow-y-auto text-sm print:max-h-none">
          <div className="text-center border-b border-black pb-3">
            <p className="font-bold uppercase text-base">Phòng Khám Đa Khoa MedCare</p>
            <h1 className="font-bold uppercase text-lg mt-2">Đơn Thuốc</h1>
            <p className="text-xs">Ngày: {new Date(prescription.createdAt).toLocaleString('vi-VN')}</p>
          </div>

          <div className="space-y-1">
            <p><strong>Họ tên bệnh nhân:</strong> {prescription.patientId?.fullName || '................'}</p>
            <p><strong>Email:</strong> {prescription.patientId?.email || '................'}</p>
            <p><strong>Bác sĩ khám:</strong> {prescription.doctorId?.fullName || '................'}</p>
          </div>

          <table className="w-full border border-black border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1.5 w-10">STT</th>
                <th className="border border-black px-2 py-1.5 text-left">Tên thuốc & Cách dùng</th>
                <th className="border border-black px-2 py-1.5 w-20">SL</th>
                <th className="border border-black px-2 py-1.5 w-28 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((med, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-black px-2 py-1.5">
                    <p className="font-semibold">{med.medicineName}</p>
                    <p className="italic">{med.dosage}</p>
                  </td>
                  <td className="border border-black px-2 py-1.5 text-center">{med.quantity} {med.unit}</td>
                  <td className="border border-black px-2 py-1.5 text-right">{med.subTotal.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-start gap-4 pt-1">
            <p className="text-xs"><strong>Lời dặn:</strong> {prescription.doctorNotes}</p>
            <p className="font-bold shrink-0">Tổng cộng: {prescription.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
            <div>
              <p className="font-bold">Bác sĩ kê đơn</p>
              <p className="italic">(Ký, ghi rõ họ tên)</p>
              <p className="mt-12 font-semibold">{prescription.doctorId?.fullName || ''}</p>
            </div>
            <div>
              <p className="font-bold">Dược sĩ cấp phát</p>
              <p className="italic">(Ký, ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintablePrescription;
