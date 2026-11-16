import React, { useState } from 'react';
import { MessageSquare, Star, Send, ThumbsUp, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

const MOCK_QUESTIONS = [
  {
    id: 'q1',
    author: 'Nguyễn Thu Trang',
    title: 'Thường xuyên bị đau nửa đầu kèm buồn nôn sau khi làm việc máy tính',
    content: 'Em làm văn phòng, gần đây hay bị giật nhói nửa đầu bên phải, mắt mờ nhẹ. Em nên đi khám khoa nào ạ?',
    specialty: 'Thần kinh',
    doctorAnswer: {
      doctorName: 'BSCKII. Lê Văn Hùng',
      answer: 'Triệu chứng của bạn khá giống với đau nửa đầu Migraine. Bạn nên sắp xếp khám sớm tại chuyên khoa Thần kinh để đo điện não đồ và loại trừ các bệnh lý khác nhé!'
    },
    likes: 14
  },
  {
    id: 'q2',
    author: 'Hoàng Minh Tuấn',
    title: 'Trẻ 3 tuổi sốt 38.5 độ nhưng vẫn chơi ngoan thì có cần uống hạ sốt ngay không?',
    content: 'Bé nhà em sốt từ trưa, không ho, bú bình thường. Em có nên cho uống Hapacol 150mg không ạ?',
    specialty: 'Nhi khoa',
    doctorAnswer: {
      doctorName: 'ThS.BS. Trần Thị Mai',
      answer: 'Nếu bé vẫn tỉnh táo, chơi ngoan, mẹ có thể chườm ấm nách bẹn và theo dõi. Chỉ dùng Paracetamol khi bé sốt trên 38.5 độ hoặc quấy khóc, liều 10-15mg/kg cân nặng.'
    },
    likes: 32
  }
];

const QnAPage = () => {
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handlePostQuestion = (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newQ = {
      id: `q_${Date.now()}`,
      author: 'Tôi (Người dùng hiện tại)',
      title: newTitle,
      content: newContent,
      specialty: 'Đa khoa',
      doctorAnswer: null,
      likes: 0
    };

    setQuestions([newQ, ...questions]);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-full text-xs font-semibold mb-2">
            Phân hệ TV 5: Diễn đàn Hỏi - Đáp & Đánh giá Bác sĩ
          </span>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Hỏi Đáp Sức Khỏe Cùng Bác Sĩ Chuyên Khoa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Đặt câu hỏi ẩn danh, nhận lời khuyên y khoa chuẩn xác và đánh giá chất lượng khám.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(true)}>
          <Star className="w-4 h-4 mr-1.5 text-amber-500 fill-amber-400" /> Đánh giá bác sĩ sau khám
        </Button>
      </div>

      {/* Post Question Form */}
      <form onSubmit={handlePostQuestion} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2 text-primary-600" /> Đặt câu hỏi mới cho bác sĩ
        </h2>
        <Input
          placeholder="Tiêu đề câu hỏi ngắn gọn (VD: Đau họng uống thuốc gì)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <textarea
          rows={3}
          placeholder="Mô tả chi tiết triệu chứng, độ tuổi, các thuốc đã dùng..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          required
          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
        />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm">
            <Send className="w-4 h-4 mr-1.5" /> Gửi câu hỏi
          </Button>
        </div>
      </form>

      {/* Questions Feed */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Đăng bởi: <strong className="text-slate-600 dark:text-slate-300">{q.author}</strong></span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold">{q.specialty}</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{q.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{q.content}</p>
            </div>

            {/* Doctor Answer */}
            {q.doctorAnswer && (
              <div className="p-4 bg-primary-50/60 dark:bg-primary-950/40 border-l-4 border-primary-500 rounded-r-xl space-y-1.5 text-sm">
                <div className="flex items-center text-primary-700 dark:text-primary-300 font-bold text-xs">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-primary-600" />
                  Bác sĩ phản hồi: {q.doctorAnswer.doctorName}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{q.doctorAnswer.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Đánh giá chất lượng buổi khám"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Chỉ bệnh nhân đã hoàn thành ca khám mới có quyền đánh giá bác sĩ (chống spam).
          </p>
          <div className="flex items-center justify-center space-x-2 py-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhận xét về thái độ phục vụ, chuyên môn của bác sĩ..."
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => { alert('Cảm ơn bạn đã gửi đánh giá!'); setIsReviewModalOpen(false); }}>
              Gửi Đánh Giá
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QnAPage;
