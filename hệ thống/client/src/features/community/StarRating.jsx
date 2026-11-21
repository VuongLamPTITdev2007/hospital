import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Component: StarRating
 * Hiển thị số sao đánh giá (chế độ xem hoặc tương tác chọn 1-5 sao)
 * @param {number} rating - Điểm số sao hiện tại (1 - 5)
 * @param {number} maxRating - Số sao tối đa (mặc định 5)
 * @param {string} size - Kích thước: 'sm' | 'md' | 'lg'
 * @param {boolean} interactive - Cho phép bấm chọn sao hay chỉ xem
 * @param {Function} onChange - Callback khi người dùng chọn điểm sao
 * @param {boolean} showLabel - Hiển thị nhãn mô tả mức độ hài lòng
 */
const StarRating = ({
  rating = 5,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showLabel = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const ratingLabels = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng & Tin tưởng'
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= activeRating;

          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-110 transition-transform p-0.5'
                  : 'cursor-default'
              } focus:outline-none`}
              aria-label={`${starValue} sao`}
            >
              <Star
                className={`${starSizes[size] || starSizes.md} transition-colors ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          );
        })}
        {!interactive && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1.5">
            {rating.toFixed(1)} / {maxRating}
          </span>
        )}
      </div>

      {showLabel && interactive && activeRating > 0 && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          {ratingLabels[activeRating] || ''}
        </span>
      )}
    </div>
  );
};

export default StarRating;
