import React, { useState } from 'react';
import { Send, AlertCircle, HelpCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const SPECIALTY_OPTIONS = [
  'Đa khoa',
  'Thần kinh',
  'Nhi khoa',
  'Tim mạch',
  'Da liễu',
  'Tai Mũi Họng',
  'Cơ Xương Khớp',
  'Tiêu hóa - Gan mật',
  'Mắt'
];

   
                               
                                                                             
   
const QuestionFormModal = ({ isOpen, onClose, onSubmitQuestion }) => {
  const [formData, setFormData] = useState({
    title: '',
    specialty: 'Đa khoa',
    content: '',
    tags: '',
    isAnonymous: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề câu hỏi';
    } else if (formData.title.trim().length < 6) {
      newErrors.title = 'Tiêu đề câu hỏi quá ngắn (tối thiểu 6 ký tự)';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Vui lòng mô tả chi tiết triệu chứng y tế';
    } else if (formData.content.trim().length < 15) {
      newErrors.content = 'Mô tả triệu chứng cần tối thiểu 15 ký tự để bác sĩ có đủ thông tin tư vấn';
    }

    if (!formData.specialty) {
      newErrors.specialty = 'Vui lòng chọn chuyên khoa phù hợp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
                                              
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
                                         
      const tagList = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title: formData.title.trim(),
        specialty: formData.specialty,
        content: formData.content.trim(),
        tags: tagList,
        isAnonymous: formData.isAnonymous
      };

      await onSubmitQuestion(payload);
      
                                  
      setFormData({
        title: '',
        specialty: 'Đa khoa',
        content: '',
        tags: '',
        isAnonymous: false
      });
      onClose();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Không thể gửi câu hỏi, vui lòng thử lại sau.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đặt Câu Hỏi Tư Vấn Y Khoa Mới"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-xl border border-sky-100 dark:border-sky-900/60 text-xs text-sky-800 dark:text-sky-300 flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Mô tả kỹ các triệu chứng (thời gian khởi phát, vị trí đau, tiền sử bệnh, thuốc đã uống) để bác sĩ có thể đưa ra lời khuyên chính xác nhất.
          </p>
        </div>

        {             }
        <Input
          label="Tiêu đề câu hỏi"
          placeholder="VD: Bé 3 tuổi bị sốt cao kèm phát ban đỏ..."
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
          required
        />

        {                      }
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Chuyên khoa tư vấn <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SPECIALTY_OPTIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
          {errors.specialty && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.specialty}</p>
          )}
        </div>

        {                       }
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nội dung chi tiết triệu chứng <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Mô tả cụ thể biểu hiện bệnh, độ tuổi người bệnh, các triệu chứng đi kèm..."
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
              errors.content
                ? 'border-red-500 focus:ring-red-400'
                : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500'
            }`}
          />
          {errors.content ? (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.content}</p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Đã nhập: {formData.content.length} ký tự (tối thiểu 15 ký tự)
            </p>
          )}
        </div>

        {          }
        <Input
          label="Từ khóa tìm kiếm (Tags - phân cách bởi dấu phẩy)"
          placeholder="VD: sot-cao, tre-nho, phat-ban"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          helperText="Giúp người khác gặp triệu chứng tương tự dễ dàng tra cứu."
        />

        {                  }
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isAnonymous"
            checked={formData.isAnonymous}
            onChange={(e) => handleChange('isAnonymous', e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
          />
          <label htmlFor="isAnonymous" className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
            Đăng ẩn danh (Ẩn tên thật của bạn để đảm bảo tính riêng tư bệnh án)
          </label>
        </div>

        {             }
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            <Send className="w-4 h-4 mr-1.5" /> Gửi câu hỏi cho Bác sĩ
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuestionFormModal;
