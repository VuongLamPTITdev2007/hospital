import React, { useState } from 'react';
import { User, ClipboardList, CheckCircle, Upload, FileText } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const MOCK_PATIENTS = [
  { id: 'app1', name: 'Trần Văn Bình', age: 42, slot: '08:00 - 08:30', status: 'waiting', symptoms: 'Đau tức ngực trái khi gắng sức' },
  { id: 'app2', name: 'Lê Thị Thu', age: 29, slot: '09:00 - 09:30', status: 'examining', symptoms: 'Khó thở về đêm, tim đập nhanh' },
  { id: 'app3', name: 'Phạm Minh Đức', age: 55, slot: '09:30 - 10:00', status: 'completed', symptoms: 'Tái khám huyết áp' },
];

const DoctorWorkspacePage = () => {
  const [activePatient, setActivePatient] = useState(MOCK_PATIENTS[1]);
  const [diagnosis, setDiagnosis] = useState('Rối loạn nhịp tim / Tăng huyết áp độ 1');
  const [medicalHistory, setMedicalHistory] = useState('Có tiền sử gia đình bị tim mạch, không dị ứng thuốc');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveRecord = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-full text-xs font-semibold mb-2">
          Phân hệ TV 3: Bàn làm việc Bác sĩ & Hồ sơ Bệnh án (EHR)
        </span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Phòng Khám Bác Sĩ – Tiếp Nhận & Lập Bệnh Án
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bác sĩ theo dõi danh sách chờ khám, ghi nhận triệu chứng và kết luận chẩn đoán điện tử.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-primary-600" /> Danh sách bệnh nhân ca sáng
          </h2>

          <div className="space-y-2.5">
            {MOCK_PATIENTS.map((p) => {
              const isCurrent = activePatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePatient(p)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-1 ring-primary-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{p.slot}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">Triệu chứng: {p.symptoms}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{p.age} tuổi</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      p.status === 'examining'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        : p.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {p.status === 'examining' ? 'Đang khám' : p.status === 'completed' ? 'Đã xong' : 'Đang chờ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medical Record Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Hồ sơ bệnh án điện tử: {activePatient?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Mã hồ sơ: #EHR-{activePatient?.id}-2026</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              Khung giờ: {activePatient?.slot}
            </span>
          </div>

          {isSaved && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Đã lưu bệnh án điện tử thành công vào CSDL MongoDB!
            </div>
          )}

          <form onSubmit={handleSaveRecord} className="mt-5 space-y-4">
            <Input
              label="Lý do khám / Triệu chứng ban đầu"
              defaultValue={activePatient?.symptoms}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tiền sử bệnh & Dị ứng
              </label>
              <textarea
                rows={2}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kết luận chẩn đoán chuyên môn <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {/* Attached files simulation */}
            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center">
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Tải lên ảnh siêu âm, điện tâm đồ hoặc kết quả xét nghiệm máu</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG, PDF (Tối đa 5MB)</p>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="outline">
                Chuyển tiếp kê đơn thuốc (TV4)
              </Button>
              <Button type="submit" variant="primary">
                Lưu Bệnh Án Điện Tử
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorWorkspacePage;
