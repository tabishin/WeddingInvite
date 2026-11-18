import React, { useState, useEffect } from 'react';
import { WeddingTheme } from '../../types/wedding';
import { isThemeOrBackgroundDark, getThemeTimingColor, getThemeLabelColor } from '../../services/colorUtils';

interface CountdownTimerProps {
  targetDate: string;
  theme: WeddingTheme;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, theme, label }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(targetDate) - +new Date();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isPast: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <div 
        className="text-center py-4 px-6 rounded-2xl border"
        style={{ 
          backgroundColor: theme.colors.badgeBg, 
          borderColor: theme.colors.cardBorder,
          color: theme.colors.badgeText 
        }}
      >
        <span className="text-sm font-semibold tracking-wide uppercase">
          Happily Celebrated ✨ Today and forever
        </span>
      </div>
    );
  }

  const items = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  const isDark = isThemeOrBackgroundDark(theme);
  const numberColor = isDark ? getThemeTimingColor(theme) : theme.colors.textHeading;
  const labelColor = isDark ? getThemeLabelColor(theme) : theme.colors.textMuted;

  return (
    <div className="w-full max-w-lg mx-auto my-6">
      {label && (
        <p
          className="text-center text-xs sm:text-sm font-semibold tracking-wider uppercase mb-2.5"
          style={{ color: labelColor }}
        >
          {label}
        </p>
      )}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl border backdrop-blur-xs transition-transform duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: theme.colors.badgeBg,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <span
              className="text-xl sm:text-3xl font-bold tracking-tight"
              style={{
                color: numberColor,
                fontFamily: theme.fontFamily.heading,
              }}
            >
              {String(item.value).padStart(2, '0')}
            </span>
            <span
              className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-1"
              style={{ color: labelColor }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
