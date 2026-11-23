import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  MessageSquarePlus, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  HelpCircle, 
  ThumbsUp, 
  MessageSquare,
  CalendarCheck,
  AlertCircle,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

// Import các component con của phân hệ community
import StarRating from './StarRating';
import QuestionCard from './QuestionCard';
import QuestionFormModal from './QuestionFormModal';
import ReviewModal from './ReviewModal';
import QuestionDetailModal from './QuestionDetailModal';
import DoctorReviewsTab from './DoctorReviewsTab';
import AppointmentHistory from './AppointmentHistory';

const SPECIALTY_FILTERS = [
  'Tất cả',
  'Thần kinh',
  'Nhi khoa',
  'Tim mạch',
  'Da liễu',
  'Tai Mũi Họng',
  'Cơ Xương Khớp',
  'Tiêu hóa - Gan mật'
];

/**
 * Phân hệ TV 5: Diễn đàn Hỏi - Đáp Y tế & Đánh giá Bác sĩ
 * Kết nối Full-Stack 100% với MongoDB Atlas qua axiosClient:
 * 1. Tab "Diễn đàn Hỏi - Đáp": GET/POST/DELETE câu hỏi, PATCH Like, POST bình luận, phân trang, tìm kiếm mượt mà.
 * 2. Tab "Đánh giá Bác sĩ": GET/POST đánh giá, tính điểm trung bình từ MongoDB.
 * 3. Tab "Lịch sử khám của tôi": GET ca khám thật từ MongoDB, kiểm tra quyền và khóa nút khi đã đánh giá.
 */
const QnAPage = () => {
  const { user, isAuthenticated } = useAuth();

  // State tab chuyển đổi: 'qna' | 'reviews' | 'history'
  const [activeTab, setActiveTab] = useState('qna');

  // State dữ liệu thực tế từ MongoDB Atlas (không dùng mock fallback)
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // State trạng thái tải dữ liệu và lỗi
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const isInitialLoadedRef = useRef(false);

  // State phân trang cho diễn đàn hỏi đáp
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // State tìm kiếm và lọc trong tab QnA
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tất cả');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'doctor_answered' | 'unanswered'

  // State quản lý Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedDoctorForReview, setSelectedDoctorForReview] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedQuestionForDetail, setSelectedQuestionForDetail] = useState(null);

  // ==================== CÁC HÀM GỌI API BACKEND (axiosClient) ====================

  // 1. Tải danh sách câu hỏi từ MongoDB (kèm phân trang & tìm kiếm mượt không chớp)
  const fetchQuestions = useCallback(async (page = 1, isSilent = false) => {
    if (isSilent) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const params = {
        page,
        limit: 10
      };
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (selectedSpecialty && selectedSpecialty !== 'Tất cả') {
        params.specialty = selectedSpecialty;
      }

      const res = await axiosClient.get('/discussions', { params });
      if (res.success) {
        setQuestions(res.discussions || []);
        setTotalPages(res.totalPages || 1);
        setTotalQuestions(res.total || 0);
        setCurrentPage(res.page || page);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách câu hỏi từ máy chủ.');
    } finally {
      setLoading(false);
      setIsSearching(false);
      isInitialLoadedRef.current = true;
    }
  }, [debouncedSearch, selectedSpecialty]);

  // 2. Tải danh sách đánh giá bác sĩ từ MongoDB
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/discussions/reviews');
      if (res.success) {
        setReviews(res.reviews || []);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đánh giá từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Tải lịch sử ca khám của tôi từ MongoDB
  const fetchMyAppointments = useCallback(async () => {
    if (!isAuthenticated) {
      setAppointments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/discussions/my-appointments');
      if (res.success) {
        setAppointments(res.appointments || []);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách ca khám của bạn.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Khi debouncedSearch hoặc selectedSpecialty thay đổi -> tự động reset về trang 1
  useEffect(() => {
    if (activeTab === 'qna') {
      const isSilent = isInitialLoadedRef.current;
      setCurrentPage(1);
      fetchQuestions(1, isSilent);
    }
  }, [debouncedSearch, selectedSpecialty, fetchQuestions, activeTab]);

  // Tự động tải dữ liệu theo tab đang được kích hoạt
  useEffect(() => {
    if (activeTab === 'qna') {
      if (!isInitialLoadedRef.current) {
        fetchQuestions(1, false);
      }
    } else if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'history') {
      fetchMyAppointments();
    }
  }, [activeTab, fetchReviews, fetchMyAppointments]);

  // Xử lý chuyển trang đơn giản
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchQuestions(newPage, true);
  };

  // ==================== CÁC HÀNH ĐỘNG TƯƠNG TÁC (MUTATIONS) ====================

  // Mở modal đánh giá tự chọn bác sĩ
  const handleOpenGenericReview = () => {
    setSelectedDoctorForReview(null);
    setSelectedAppointmentId(null);
    setIsReviewModalOpen(true);
  };

  // Mở modal đánh giá gắn với 1 ca khám cụ thể (khóa cứng bác sĩ)
  const handleOpenReviewForAppointment = (appointment) => {
    setSelectedDoctorForReview({
      id: appointment.doctorId,
      name: appointment.doctorName,
      specialty: appointment.specialty,
      appointmentId: appointment.id
    });
    setSelectedAppointmentId(appointment.id);
    setIsReviewModalOpen(true);
  };

  // Đăng câu hỏi tư vấn mới lên MongoDB
  const handleCreateQuestion = async (formData) => {
    try {
      const res = await axiosClient.post('/discussions', formData);
      if (res.success && res.discussion) {
        setQuestions((prev) => [res.discussion, ...prev]);
        setTotalQuestions((prev) => prev + 1);
        setIsQuestionModalOpen(false);
      }
    } catch (err) {
      throw new Error(err.message || 'Không thể đăng câu hỏi.');
    }
  };

  // Thích / Bỏ thích câu hỏi (Toggle Like lưu vào MongoDB)
  const handleLikeQuestion = async (questionId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để bấm thích câu hỏi này!');
      return;
    }

    try {
      const res = await axiosClient.patch(`/discussions/${questionId}/like`);
      if (res.success) {
        setQuestions((prev) =>
          prev.map((q) => {
            const currentId = q._id || q.id;
            if (currentId === questionId) {
              return {
                ...q,
                isLiked: res.isLiked,
                likesCount: res.likesCount
              };
            }
            return q;
          })
        );
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật lượt thích.');
    }
  };

  // Xóa câu hỏi (DELETE /api/discussions/:id)
  const handleDeleteQuestion = async (questionId) => {
    try {
      const res = await axiosClient.delete(`/discussions/${questionId}`);
      if (res.success) {
        setQuestions((prev) =>
          prev.filter((q) => (q._id || q.id) !== questionId)
        );
        setTotalQuestions((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa câu hỏi này.');
    }
  };

  // Mở modal xem chi tiết câu hỏi & tự động đồng bộ lượt xem từ MongoDB
  const handleOpenDetail = async (question) => {
    setSelectedQuestionForDetail(question);
    const qId = question._id || question.id;
    if (!qId) return;

    try {
      const res = await axiosClient.get(`/discussions/${qId}`);
      if (res.success && res.discussion) {
        setSelectedQuestionForDetail(res.discussion);
        // Cập nhật lượt xem và bình luận mới nhất vào danh sách câu hỏi
        setQuestions((prev) =>
          prev.map((q) =>
            (q._id || q.id) === qId
              ? {
                  ...q,
                  views: res.discussion.views,
                  comments: res.discussion.comments
                }
              : q
          )
        );
      }
    } catch (err) {
      console.error('Không thể đồng bộ chi tiết câu hỏi:', err);
    }
  };

  // Gửi bình luận trao đổi lên MongoDB
  const handleAddComment = async ({ questionId, content }) => {
    try {
      const res = await axiosClient.post(`/discussions/${questionId}/comments`, { content });
      if (res.success && res.comment) {
        setQuestions((prev) =>
          prev.map((q) => {
            const currentId = q._id || q.id;
            if (currentId === questionId) {
              return {
                ...q,
                comments: [...(q.comments || []), res.comment]
              };
            }
            return q;
          })
        );

        setSelectedQuestionForDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), res.comment]
          };
        });
      }
    } catch (err) {
      throw new Error(err.message || 'Lỗi khi gửi phản hồi.');
    }
  };

  // Gửi đánh giá Bác sĩ lên MongoDB (Chống spam 3 lớp & Tính lại điểm số)
  const handleSubmitReview = async (reviewPayload) => {
    try {
      const res = await axiosClient.post('/discussions/reviews', reviewPayload);
      if (res.success) {
        // Cập nhật lại danh sách đánh giá từ MongoDB
        await fetchReviews();

        // Đổi trạng thái ca khám thành "Đã đánh giá" để vô hiệu hóa nút
        const appCode = reviewPayload.appointmentId || selectedAppointmentId;
        if (appCode) {
          setAppointments((prev) =>
            prev.map((app) =>
              (app.id === appCode || app._id === appCode)
                ? { ...app, isReviewed: true }
                : app
            )
          );
        }

        // Tự động chuyển người dùng sang tab "Đánh giá Bác sĩ"
        setActiveTab('reviews');
        setSelectedDoctorForReview(null);
        setSelectedAppointmentId(null);
      }
    } catch (err) {
      throw new Error(err.message || 'Gửi đánh giá thất bại.');
    }
  };

  // Lọc câu hỏi ở client theo chế độ có BS trả lời
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      let matchesFilterMode = true;
      const hasDoctorReply = q.doctorAnswer || q.comments?.some((c) => c.isDoctorAnswer);

      if (filterMode === 'doctor_answered') {
        matchesFilterMode = Boolean(hasDoctorReply);
      } else if (filterMode === 'unanswered') {
        matchesFilterMode = !hasDoctorReply;
      }
      return matchesFilterMode;
    });
  }, [questions, filterMode]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner Giới Thiệu Phân Hệ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
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
              onClick={handleOpenGenericReview}
              className="bg-white/80 dark:bg-slate-800 hover:shadow-sm"
            >
              <Star className="w-4 h-4 mr-2 text-amber-500 fill-amber-400" />
              Đánh giá bác sĩ sau khám
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!isAuthenticated) {
                  alert('Vui lòng đăng nhập để đặt câu hỏi cho bác sĩ!');
                  return;
                }
                setIsQuestionModalOpen(true);
              }}
              className="shadow-md shadow-primary-500/20"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Đặt câu hỏi mới
            </Button>
          </div>
        </div>
      </div>

      {/* Điều Hướng 3 Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto no-scrollbar">
        {/* Tab 1: Diễn đàn Hỏi - Đáp */}
        <button
          type="button"
          onClick={() => setActiveTab('qna')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 ${
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

        {/* Tab 2: Đánh giá Bác sĩ */}
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 ${
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

        {/* Tab 3: Lịch sử khám của tôi */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 ${
            activeTab === 'history'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-emerald-500" />
          <span>Lịch sử khám của tôi</span>
          {isAuthenticated && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'history'
                  ? 'bg-primary-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {appointments.length}
            </span>
          )}
        </button>
      </div>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between text-xs sm:text-sm text-red-600 dark:text-red-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'qna') fetchQuestions();
              else if (activeTab === 'reviews') fetchReviews();
              else if (activeTab === 'history') fetchMyAppointments();
            }}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading Spinner khi đang tải dữ liệu */}
      {loading && (
        <div className="py-12 flex justify-center">
          <Loader size="lg" text="Đang đồng bộ dữ liệu từ MongoDB Atlas..." />
        </div>
      )}

      {/* ==================== NỘI DUNG TAB 1: DIỄN ĐÀN HỎI - ĐÁP ==================== */}
      {!loading && activeTab === 'qna' && (
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
                  placeholder="Tìm kiếm theo triệu chứng, tên bệnh, từ khóa..."
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
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
          <div className={`space-y-4 transition-opacity duration-200 ${isSearching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center">
                Danh sách câu hỏi {totalQuestions > 0 ? `(${totalQuestions})` : `(${filteredQuestions.length})`}
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
                  {debouncedSearch ? 'Không tìm thấy câu hỏi phù hợp' : 'Diễn đàn hiện chưa có câu hỏi nào'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {debouncedSearch
                    ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách.'
                    : 'Hãy bấm nút "Đặt câu hỏi mới" để gửi thắc mắc y khoa đầu tiên tới đội ngũ bác sĩ chuyên khoa!'}
                </p>
                {!debouncedSearch && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!isAuthenticated) {
                        alert('Vui lòng đăng nhập để đặt câu hỏi!');
                        return;
                      }
                      setIsQuestionModalOpen(true);
                    }}
                  >
                    <MessageSquarePlus className="w-4 h-4 mr-1.5" />
                    Đặt câu hỏi ngay
                  </Button>
                )}
              </div>
            ) : (
              <>
                {filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question._id || question.id}
                    question={question}
                    currentUser={user}
                    onLike={handleLikeQuestion}
                    onDelete={handleDeleteQuestion}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}

                {/* Thanh chuyển trang (Pagination) */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-3 pt-4 pb-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || isSearching}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3.5 py-1.5 text-xs font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Trước
                    </Button>

                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2 select-none">
                      Trang <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span> / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages || isSearching}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3.5 py-1.5 text-xs font-semibold"
                    >
                      Sau
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== NỘI DUNG TAB 2: ĐÁNH GIÁ BÁC SĨ ==================== */}
      {!loading && activeTab === 'reviews' && (
        <div className="animate-fade-in">
          <DoctorReviewsTab reviews={reviews} />
        </div>
      )}

      {/* ==================== NỘI DUNG TAB 3: LỊCH SỬ KHÁM CỦA TÔI ==================== */}
      {!loading && activeTab === 'history' && (
        <div className="animate-fade-in">
          {!isAuthenticated ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-4">
              <LogIn className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Yêu Cầu Đăng Nhập
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Vui lòng đăng nhập bằng tài khoản Bệnh nhân để xem lịch sử ca khám thực tế và gửi đánh giá chất lượng buổi khám.
                </p>
              </div>
              <Link to="/login">
                <Button variant="primary" size="md">
                  Đăng nhập tài khoản Bệnh nhân
                </Button>
              </Link>
            </div>
          ) : (
            <AppointmentHistory
              appointments={appointments}
              onReviewDoctor={handleOpenReviewForAppointment}
            />
          )}
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
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedDoctorForReview(null);
          setSelectedAppointmentId(null);
        }}
        onSubmitReview={handleSubmitReview}
        doctor={selectedDoctorForReview}
        appointmentId={selectedAppointmentId}
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
