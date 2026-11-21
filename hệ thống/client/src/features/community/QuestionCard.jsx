import React from 'react';
import { MessageCircle, Eye, ThumbsUp, UserCircle, Tag } from 'lucide-react';
import DoctorAnswerBadge from './DoctorAnswerBadge';

/**
 * Component: QuestionCard
 * Thẻ hiển thị một câu hỏi y khoa trong danh sách diễn đàn
 * @param {Object} question - Đối tượng câu hỏi
 * @param {Function} onLike - Callback khi bấm Like
 * @param {Function} onOpenDetail - Callback khi muốn xem chi tiết / bình luận
 */
const QuestionCard = ({ question, onLike, onOpenDetail }) => {
  const {
    id,
    author = 'Người dùng ẩn danh',
    title,
    content,
    specialty = 'Đa khoa',
    tags = [],
    doctorAnswer,
    comments = [],
    likes = 0,
    views = 0,
    isLiked = false,
    createdAt
  } = question;

  const commentCount = comments.length || (doctorAnswer ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {author}
            </span>
            {createdAt && (
              <span className="block text-[11px] text-slate-400">
                {createdAt}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
            {specialty}
          </span>
          {doctorAnswer && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              ✓ Đã có BS trả lời
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-2 cursor-pointer" onClick={() => onOpenDetail && onOpenDetail(question)}>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
          {content}
        </p>
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
            >
              <Tag className="w-3 h-3 mr-1 text-slate-400" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Doctor Answer Preview */}
      {doctorAnswer && (
        <DoctorAnswerBadge
          doctorName={doctorAnswer.doctorName}
          specialty={doctorAnswer.specialty || specialty}
          answer={doctorAnswer.answer}
          date={doctorAnswer.date}
        />
      )}

      {/* Footer Stats & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLike && onLike(id);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              isLiked
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 font-semibold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-primary-600 dark:fill-primary-400' : ''}`} />
            <span>{likes} {isLiked ? 'Đã thích' : 'Hữu ích'}</span>
          </button>

          <span className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{views} lượt xem</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail && onOpenDetail(question)}
          className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          <MessageCircle className="w-4 h-4 mr-0.5" />
          <span>{commentCount} phản hồi</span>
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
