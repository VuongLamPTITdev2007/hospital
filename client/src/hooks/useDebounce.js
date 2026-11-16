import { useState, useEffect } from 'react';

/**
 * Custom Hook: useDebounce
 * Trì hoãn cập nhật giá trị (ví dụ: gõ tìm kiếm không gọi API liên tục)
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Hủy timeout nếu user tiếp tục gõ trước khi delay kết thúc
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
