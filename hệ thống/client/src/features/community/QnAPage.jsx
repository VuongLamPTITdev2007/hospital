import React, { useState, useMemo } from 'react';
import { 
  MessageSquarePlus, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';

// Import các component con của phân hệ community
import StarRating from './StarRating';
import QuestionCard from './QuestionCard';
import QuestionFormModal from './QuestionFormModal';
import ReviewModal from './ReviewModal';
import QuestionDetailModal from './QuestionDetailModal';
import DoctorReviewsTab from './DoctorReviewsTab';

const INITIAL_MOCK_QUESTIONS = [
  {
    id: 'q1',
    author: 'Nguyễn Thu Trang',
    title: 'Thường xuyên bị đau nửa đầu kèm buồn nôn sau khi làm việc máy tính',
    content: 'Em làm văn phòng, gần đây hay bị giật nhói nửa đầu bên phải, mắt mờ nhẹ khi nhìn màn hình máy tính lâu. Triệu chứng kéo dài khoảng 2 tuần. Em nên đi khám khoa nào và cần chuẩn bị gì trước khi khám ạ?',
    specialty: 'Thần kinh',
    tags: ['dau-nua-dau', 'mat-mo', 'van-phong'],
    doctorAnswer: {
      doctorName: 'BSCKII. Lê Văn Hùng',
      specialty: 'Thần kinh',
      answer: 'Chào bạn Trang, triệu chứng giật nhói nửa đầu kèm buồn nôn và mờ mắt là dấu hiệu điển hình của chứng đau nửa đầu Migraine hoặc căng thẳng cơ co thắt do áp lực mắt. Bạn nên sớm sắp xếp khám chuyên khoa Thần kinh để được đo lưu huyết não, chụp MRI nếu cần và loại trừ các bệnh lý thực thể.',
      date: '2026-11-20'
    },
    comments: [
      {
        authorName: 'Trần Văn Bình',
        content: 'Mình cũng từng bị như bạn, đi khám bác sĩ cho thuốc giãn cơ và tập nghỉ mắt 20-20-20 đỡ nhiều lắm!',
        isDoctorAnswer: false,
        time: 'Hôm qua'
      }
    ],
    likes: 18,
    views: 142,
    isLiked: false,
    createdAt: '2026-11-19'
  },
  {
    id: 'q2',
    author: 'Hoàng Minh Tuấn',
    title: 'Trẻ 3 tuổi sốt 38.5 độ nhưng vẫn chơi ngoan thì có cần uống hạ sốt ngay không?',
    content: 'Bé nhà em sốt từ trưa khoảng 38.5 độ, không ho sổ mũi, ăn bú bình thường. Em có nên cho uống gói Hapacol 150mg ngay hay tiếp tục chườm ấm theo dõi ạ?',
    specialty: 'Nhi khoa',
    tags: ['sot-cao', 'tre-nho', 'hapacol'],
    doctorAnswer: {
      doctorName: 'ThS.BS. Trần Thị Mai',
      specialty: 'Nhi khoa',
      answer: 'Chào anh Tuấn! Với mức nhiệt 38.5 độ nhưng bé vẫn tỉnh táo, linh hoạt và chơi ngoan, bố mẹ nên ưu tiên nới rộng quần áo thoáng mát, cho bé uống nhiều nước hoặc oresol và chườm ấm nách bẹn. Nếu thân nhiệt tăng trên 38.5 độ hoặc bé có dấu hiệu mệt mỏi, quấy khóc thì cho uống Paracetamol liều 10 - 15mg/kg cân nặng, cách nhau tối thiểu 4-6 giờ.',
      date: '2026-11-21'
    },
    comments: [],
    likes: 35,
    views: 280,
    isLiked: true,
    createdAt: '2026-11-21'
  },
  {
    id: 'q3',
    author: 'Phạm Hồng Nhung',
    title: 'Dấu hiệu hồi hộp, tim đập nhanh vào ban đêm khi nằm nghiêng bên trái',
    content: 'Gần đây mỗi lần đi ngủ em nằm nghiêng sang trái là cảm nhận rõ tim đập thình thịch, hơi khó thở nhẹ, đo huyết áp tại nhà là 125/80. Liệu đây có phải là rối loạn nhịp tim không?',
    specialty: 'Tim mạch',
    tags: ['tim-dap-nhanh', 'kho-tho', 'hoi-hop'],
    doctorAnswer: null,
    comments: [
      {
        authorName: 'Đỗ Kim Oanh',
        content: 'Bạn nên hạn chế uống trà sữa hoặc cafe sau 3h chiều xem có đỡ không nhé.',
        isDoctorAnswer: false,
        time: '3 giờ trước'
      }
    ],
    likes: 8,
    views: 64,
    isLiked: false,
    createdAt: '2026-11-21'
  }
];

const INITIAL_MOCK_REVIEWS = [
  {
    id: 'rev_1',
    patientName: 'Trần Thị Thanh Hằng',
    doctorId: 'doc_hung',
    doctorName: 'BSCKII. Lê Văn Hùng',
    specialty: 'Thần kinh',
    rating: 5,
    comment: 'Bác sĩ Hùng khám rất kỹ tính, giải thích nguyên nhân đau nửa đầu rõ ràng và dặn dò chế độ sinh hoạt chu đáo.',
    createdAt: '2026-11-20',
    appointmentId: 'MED-7821',
    verified: true
  },
  {
    id: 'rev_2',
    patientName: 'Phạm Minh Quân',
    doctorId: 'doc_an',
    doctorName: 'BSCKII. Nguyễn Văn An',
    specialty: 'Tim mạch',
    rating: 5,
    comment: 'Bác sĩ An tư vấn tận tâm, đọc kết quả điện tâm đồ giải thích từng chỉ số cho người nhà dễ hiểu.',
    createdAt: '2026-11-20',
    appointmentId: 'MED-4319',
    verified: true
  },
  {
    id: 'rev_3',
    patientName: 'Lê Hoàng Yến',
    doctorId: 'doc_mai',
    doctorName: 'ThS.BS. Trần Thị Mai',
    specialty: 'Nhi khoa',
    rating: 5,
    comment: 'Bác sĩ Mai nhẹ nhàng với các bé lắm, bé nhà mình sợ khám mà gặp bác là ngoan ngoãn hợp tác ngay. Rất an tâm!',
    createdAt: '2026-11-21',
    appointmentId: 'MED-9021',
    verified: true
  },
  {
    id: 'rev_4',
    patientName: 'Nguyễn Văn Đạt',
    doctorId: 'doc_nam',
    doctorName: 'TS.BS. Lê Hoàng Nam',
    specialty: 'Cơ xương khớp',
    rating: 4,
    comment: 'Phòng khám hiện đại, bác sĩ nắn chỉnh khớp gối bớt đau hẳn. Cho 4 sao vì phòng chờ hơi đông một chút.',
    createdAt: '2026-11-21',
    appointmentId: 'MED-6102',
    verified: true
  },
  {
    id: 'rev_5',
    patientName: 'Đặng Kim Chi',
    doctorId: 'doc_hung',
    doctorName: 'BSCKII. Lê Văn Hùng',
    specialty: 'Thần kinh',
    rating: 5,
    comment: 'Sau 1 tuần uống thuốc theo đơn bác sĩ Hùng kê, chứng mất ngủ và chóng mặt đã giảm rõ rệt.',
    createdAt: '2026-11-21',
    appointmentId: 'MED-8211',
    verified: true
  },
  {
    id: 'rev_6',
    patientName: 'Vũ Quốc Bảo',
    doctorId: 'doc_an',
    doctorName: 'BSCKII. Nguyễn Văn An',
    specialty: 'Tim mạch',
    rating: 4,
    comment: 'Bác sĩ thân thiện, chuyên môn vững vàng, kê đơn thuốc vừa phải không lạm dụng thuốc đắt tiền.',
    createdAt: '2026-11-22',
    appointmentId: 'MED-5541',
    verified: true
  }
];

const SPECIALTY_FILTERS = [
  'Tất cả',
  'Thần kinh',
  'Nhi khoa',
  'Tim mạch',
  'Da liễu',
  'Tai Mũi Họng'
];

/**
 * Phân hệ TV 5: Diễn đàn Hỏi - Đáp Y tế & Đánh giá Bác sĩ
 * Đảm nhiệm:
 * 1. Tab "Diễn đàn Hỏi - Đáp": Thảo luận sức khỏe, tìm kiếm useDebounce, lọc chuyên khoa.
 * 2. Tab "Đánh giá Bác sĩ": Điểm số trung bình useMemo, thống kê lượt đánh giá, danh sách công khai.
 * 3. ReviewModal: Chống spam, cập nhật tức thì vào danh sách đánh giá.
 */
const QnAPage = () => {
  const { user } = useAuth();

  // State tab chuyển đổi: 'qna' | 'reviews'
  const [activeTab, setActiveTab] = useState('qna');

  // State danh sách câu hỏi và danh sách đánh giá
  const [questions, setQuestions] = useState(INITIAL_MOCK_QUESTIONS);
  const [reviews, setReviews] = useState(INITIAL_MOCK_REVIEWS);
  
  // State tìm kiếm và lọc trong tab QnA
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tất cả');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'doctor_answered' | 'unanswered'

  // State quản lý Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedQuestionForDetail, setSelectedQuestionForDetail] = useState(null);

  // Xử lý Thích câu hỏi (Optimistic UI Update)
  const handleLikeQuestion = (questionId) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id === questionId) {
          const isLiked = !q.isLiked;
          return {
            ...q,
            isLiked,
            likes: isLiked ? q.likes + 1 : q.likes - 1
          };
        }
        return q;
      })
    );
  };

  // Xử lý Tạo câu hỏi mới
  const handleCreateQuestion = async (formData) => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      author: formData.isAnonymous ? 'Người dùng ẩn danh' : (user?.name || 'Nguyễn Thuỳ Linh (Bệnh nhân)'),
      title: formData.title,
      content: formData.content,
      specialty: formData.specialty,
      tags: formData.tags,
      doctorAnswer: null,
      comments: [],
      likes: 0,
      views: 1,
      isLiked: false,
      createdAt: 'Vừa xong'
    };

    setQuestions((prev) => [newQuestion, ...prev]);
  };

  // Xử lý Gửi đánh giá bác sĩ mới -> Cập nhật ngay vào state reviews và chuyển tab
  const handleSubmitReview = async (reviewData) => {
    const newRev = {
      id: `rev_${Date.now()}`,
      patientName: user?.name || 'Nguyễn Thuỳ Linh (Bệnh nhân)',
      doctorId: reviewData.doctorId,
      doctorName: reviewData.doctorName,
      specialty: reviewData.specialty,
      rating: Number(reviewData.rating),
      comment: reviewData.comment,
      createdAt: new Date().toISOString().split('T')[0],
      appointmentId: reviewData.appointmentId || `MED-${Math.floor(1000 + Math.random() * 9000)}`,
      verified: true
    };

    // Cập nhật danh sách đánh giá ngay lập tức (Optimistic UI)
    setReviews((prev) => [newRev, ...prev]);
    
    // Tự động chuyển người dùng sang tab "Đánh giá Bác sĩ" để kiểm tra kết quả vừa đăng
    setActiveTab('reviews');
  };

  // Xử lý Thêm bình luận vào câu hỏi chi tiết
  const handleAddComment = async ({ questionId, content, isDoctorAnswer }) => {
    const newComment = {
      authorName: user?.name || (isDoctorAnswer ? 'BSCK. Tư Vấn' : 'Tôi'),
      content,
      isDoctorAnswer,
      time: 'Vừa xong'
    };

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            comments: [...q.comments, newComment]
          };
        }
        return q;
      })
    );

    setSelectedQuestionForDetail((prev) => {
      if (!prev || prev.id !== questionId) return prev;
      return {
        ...prev,
        comments: [...prev.comments, newComment]
      };
    });
  };

  // Tối ưu lọc danh sách câu hỏi bằng useMemo (Tiêu chí 4)
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSpecialty =
        selectedSpecialty === 'Tất cả' || q.specialty === selectedSpecialty;

      const keyword = debouncedSearch.toLowerCase().trim();
      const matchesKeyword =
        !keyword ||
        q.title.toLowerCase().includes(keyword) ||
        q.content.toLowerCase().includes(keyword) ||
        q.tags?.some((t) => t.toLowerCase().includes(keyword));

      let matchesFilterMode = true;
      if (filterMode === 'doctor_answered') {
        matchesFilterMode = Boolean(q.doctorAnswer);
      } else if (filterMode === 'unanswered') {
        matchesFilterMode = !q.doctorAnswer;
      }

      return matchesSpecialty && matchesKeyword && matchesFilterMode;
    });
  }, [questions, debouncedSearch, selectedSpecialty, filterMode]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner Giới Thiệu Phân Hệ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-600 dark:text-sky-400" />
              <span>Cộng đồng Y khoa & Tư vấn Sức khỏe</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Hỏi Đáp Sức Khỏe & Đánh Giá Phòng Khám
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Nhận tư vấn y khoa chuẩn xác từ đội ngũ Bác sĩ chuyên khoa tại MedCare. Bệnh nhân sau buổi khám có thể gửi đánh giá xác thực để nâng cao chất lượng dịch vụ.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsReviewModalOpen(true)}
              className="bg-white/80 dark:bg-slate-800 hover:shadow-sm"
            >
              <Star className="w-4 h-4 mr-2 text-amber-500 fill-amber-400" />
              Đánh giá bác sĩ sau khám
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsQuestionModalOpen(true)}
              className="shadow-md shadow-primary-500/20"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Đặt câu hỏi mới
            </Button>
          </div>
        </div>
      </div>

      {/* Điều Hướng 2 Tabs: "Diễn đàn Hỏi - Đáp" & "Đánh giá Bác sĩ" */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('qna')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'qna'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Diễn đàn Hỏi - Đáp</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'qna'
                ? 'bg-primary-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {questions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'reviews'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Đánh giá Bác sĩ</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'reviews'
                ? 'bg-primary-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {reviews.length}
          </span>
        </button>
      </div>

      {/* Nội Dung Tab 1: Diễn đàn Hỏi - Đáp */}
      {activeTab === 'qna' && (
        <div className="space-y-6 animate-fade-in">
          {/* Thanh Tìm Kiếm & Bộ Lọc Nâng Cao */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Ô Tìm Kiếm Có Áp Dụng useDebounce */}
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo triệu chứng, tên bệnh, từ khóa (dùng useDebounce)..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchTerm && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    debounce: 400ms
                  </span>
                )}
              </div>

              {/* Lọc Trạng Thái Phản Hồi */}
              <div className="sm:col-span-4 flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="doctor_answered">Đã có BS phản hồi</option>
                  <option value="unanswered">Chờ bác sĩ trả lời</option>
                </select>
              </div>
            </div>

            {/* Danh Mục Tabs Chuyên Khoa */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1">Chuyên khoa:</span>
              {SPECIALTY_FILTERS.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                    selectedSpecialty === specialty
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Danh Sách Câu Hỏi Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                Danh sách câu hỏi ({filteredQuestions.length})
              </h2>
              {debouncedSearch && (
                <span className="text-xs text-primary-600">
                  Kết quả tìm kiếm cho: "{debouncedSearch}"
                </span>
              )}
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Không tìm thấy câu hỏi phù hợp
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút "Đặt câu hỏi mới" để được bác sĩ tư vấn.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSpecialty('Tất cả');
                    setFilterMode('all');
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onLike={handleLikeQuestion}
                  onOpenDetail={(q) => setSelectedQuestionForDetail(q)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Nội Dung Tab 2: Đánh Giá Bác Sĩ (DoctorReviewsTab) */}
      {activeTab === 'reviews' && (
        <div className="animate-fade-in">
          <DoctorReviewsTab reviews={reviews} />
        </div>
      )}

      {/* Modal Đặt Câu Hỏi */}
      <QuestionFormModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSubmitQuestion={handleCreateQuestion}
      />

      {/* Modal Đánh Giá Bác Sĩ (Chống spam) */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmitReview={handleSubmitReview}
      />

      {/* Modal Chi Tiết Thảo Luận & Bình Luận */}
      <QuestionDetailModal
        isOpen={Boolean(selectedQuestionForDetail)}
        onClose={() => setSelectedQuestionForDetail(null)}
        question={selectedQuestionForDetail}
        onAddComment={handleAddComment}
        currentUser={user}
      />
    </div>
  );
};

export default QnAPage;
