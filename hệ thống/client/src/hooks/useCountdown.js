import { useState, useEffect } from 'react';

   
                            
                                                                            
   
export const useCountdown = (initialSeconds, onFinish) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let intervalId = null;

    if (isActive && secondsLeft > 0) {
      intervalId = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      if (onFinish && typeof onFinish === 'function') {
        onFinish();
      }
    }

                                                      
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, secondsLeft, onFinish]);

  const start = () => setIsActive(true);
  const pause = () => setIsActive(false);
  const reset = (newSeconds = initialSeconds) => {
    setIsActive(false);
    setSecondsLeft(newSeconds);
  };

  const formatTime = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return { secondsLeft, isActive, start, pause, reset, formatTime };
};
