import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WeddingTheme, WeddingProject, WeddingEvent } from '../../types/wedding';
import { Sparkles, Calendar, RotateCcw, Check, MapPin, Clock } from 'lucide-react';
import { resolveEventDate, parseTimeString } from '../../services/storage';

interface ScratchToRevealDateProps {
  theme: WeddingTheme;
  project: WeddingProject;
  className?: string;
  customDateFormatted?: string;
  activeEvent?: WeddingEvent;
}

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  alpha: number;
}

export const ScratchToRevealDate: React.FC<ScratchToRevealDateProps> = ({
  theme,
  project,
  className = '',
  customDateFormatted,
  activeEvent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);
  const lastSampleTimeRef = useRef<number>(0);

  const couple = project.couple;
  const initial1 = couple.partner1 ? couple.partner1.charAt(0).toUpperCase() : 'S';
  const initial2 = couple.partner2 ? couple.partner2.charAt(0).toUpperCase() : 'A';

  // Play auspicious harp chime upon revealing date
  const playRevealSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Joyous ascending pentatonic flourish (C5, D5, E5, G5, A5, C6)
      const freqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.4);
      });
    } catch {
      // Audio restricted before user gesture
    }
  }, []);

  // Initialize and paint the metallic golden scratch foil
  const drawFoilLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.globalCompositeOperation = 'source-over';

    // 1. Rich metallic golden gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#B45309');   // Deep amber gold
    gradient.addColorStop(0.2, '#F59E0B'); // Warm gold
    gradient.addColorStop(0.45, '#FEF08A'); // Shimmering light gold highlight
    gradient.addColorStop(0.55, '#FDE68A'); // Gold luster
    gradient.addColorStop(0.8, '#D97706'); // Burnished gold
    gradient.addColorStop(1, '#92400E');   // Bronze gold edge
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Micro-glitter texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Ornate golden border frame on foil
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // 4. Draw 3 distinct scratch card segments side-by-side matching reference video 0:06
    const padding = 12;
    const gap = 8;
    const totalW = width - padding * 2;
    const cardWidth = (totalW - gap * 2) / 3;
    const cardHeight = height - 52;
    const cardY = 16;
    const cardLabels = ['DAY', 'MONTH', 'YEAR'];

    for (let i = 0; i < 3; i++) {
      const cardX = padding + i * (cardWidth + gap);
      // Card subtle background shade
      ctx.fillStyle = 'rgba(120, 53, 15, 0.18)';
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      
      // Card gilded outline
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      // Card Header Tag
      ctx.fillStyle = '#78350F';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cardLabels[i], cardX + cardWidth / 2, cardY + 20);

      // Card Center Sparkle Foil Medallion
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cardX + cardWidth / 2, cardY + cardHeight / 2 + 6, Math.min(cardWidth, cardHeight) * 0.22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#451A03';
      ctx.font = '16px serif';
      ctx.fillText('✨', cardX + cardWidth / 2, cardY + cardHeight / 2 + 7);
    }

    // Bottom scratch hint banner
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH EACH CARD TO REVEAL ✨', width / 2, height - 14);
  }, []);

  // Set up canvas dimensions on mount & resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      drawFoilLayer();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [drawFoilLayer]);

  // Check how much percentage of the foil has been scratched away
  const calculateScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample pixels across a 32x32 grid for high performance
    const sampleSize = 32;
    const stepX = canvas.width / sampleSize;
    const stepY = canvas.height / sampleSize;
    let transparentCount = 0;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const px = Math.floor(x * stepX);
        const py = Math.floor(y * stepY);
        const alpha = data[(py * canvas.width + px) * 4 + 3];
        if (alpha < 128) {
          transparentCount++;
        }
      }
    }

    const percent = Math.round((transparentCount / (sampleSize * sampleSize)) * 100);
    setScratchPercent(percent);

    // Auto-reveal if user scratched 40% or more
    if (percent >= 40 && !isScratched) {
      triggerFullReveal();
    }
  }, [isScratched]);

  const triggerFullReveal = () => {
    setIsScratched(true);
    setScratchPercent(100);
    playRevealSound();

    // Fade out canvas cleanly
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = 'opacity 0.6s ease-out';
      canvas.style.opacity = '0';
      setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 600);
    }
  };

  const handleResetCard = () => {
    setIsScratched(false);
    setScratchPercent(0);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = 'none';
      canvas.style.opacity = '1';
    }
    drawFoilLayer();
  };

  // Perform scratching action at coordinate (clientX, clientY)
  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    // Add gentle sparkle dust particle
    if (Math.random() > 0.4) {
      const newParticle: SparkleParticle = {
        id: Math.random(),
        x,
        y,
        size: Math.random() * 4 + 2,
        color: ['#FDE68A', '#F59E0B', '#FFFFFF', '#FEF08A'][Math.floor(Math.random() * 4)],
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        alpha: 1,
      };
      setParticles((prev) => [...prev.slice(-20), newParticle]);
    }

    // Throttle calculation of scratch percentage (sample every 150ms)
    const now = Date.now();
    if (now - lastSampleTimeRef.current > 150) {
      lastSampleTimeRef.current = now;
      calculateScratchPercentage();
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    calculateScratchPercentage();
  };

  // Touch event handlers (with touchAction: none to stop unwanted scroll)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    if (e.touches.length > 0) {
      scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.touches.length > 0) {
      scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    calculateScratchPercentage();
  };

  // Animate flying sparkle dust particles
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.05,
          }))
          .filter((p) => p.alpha > 0)
      );
    });
    return () => cancelAnimationFrame(timer);
  }, [particles]);

  const displayDate = customDateFormatted || activeEvent?.formattedDate || project.weddingDateFormatted;
  const targetEvent = activeEvent || project.events[0];

  // Parse Day, Month, Year parts for the 3-card reveal matching video reference 0:06
  const parseDateParts = () => {
    let dateObj = new Date(project.weddingDate);
    if (targetEvent?.date) {
      const parsed = new Date(`${targetEvent.date}T12:00:00`);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
    }
    const day = isNaN(dateObj.getDate()) ? '14' : String(dateObj.getDate());
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = isNaN(dateObj.getMonth()) ? 'February' : monthNames[dateObj.getMonth()];
    const year = isNaN(dateObj.getFullYear()) ? '2027' : String(dateObj.getFullYear());
    return { day, month, year };
  };

  const dateParts = parseDateParts();

  // Google Calendar URL generator
  const createGoogleCalendarUrl = () => {
    const eventTitle = targetEvent?.name ? `${targetEvent.name} - ${project.couple.formattedTitle}` : `Wedding of ${project.couple.formattedTitle}`;
    const title = encodeURIComponent(eventTitle);
    const details = encodeURIComponent(`${project.tagline}\n\nCelebration date: ${displayDate}`);
    const venueName = targetEvent?.venue?.name || targetEvent?.venueName || 'Wedding Venue';
    const venueAddress = targetEvent?.venue?.address || '';
    const location = encodeURIComponent([venueName, venueAddress].filter(Boolean).join(', '));
    
    // Resolve start and end dates from event
    const { dateStr } = resolveEventDate({
      date: targetEvent?.date || project.weddingDate,
      formattedDate: displayDate,
    });
    const startTime = parseTimeString(targetEvent?.time || '3:30 PM');
    const endTime = parseTimeString(targetEvent?.endTime || '6:00 PM');
    const startHourStr = String(startTime.hours).padStart(2, '0');
    const startMinStr = String(startTime.minutes).padStart(2, '0');
    const endHourStr = String(endTime.hours).padStart(2, '0');
    const endMinStr = String(endTime.minutes).padStart(2, '0');
    const dates = `${dateStr}T${startHourStr}${startMinStr}00/${dateStr}T${endHourStr}${endMinStr}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  return (
    <section className={`relative w-full max-w-xl mx-auto my-12 ${className}`}>
      {/* Container Frame with Opulent Royal Styling */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 text-center overflow-hidden transition-all duration-500 shadow-2xl border-2"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.goldOrMetallic,
          boxShadow: `0 20px 45px -10px ${theme.colors.glowEffect || 'rgba(212, 175, 55, 0.25)'}`,
        }}
      >
        {/* Header Ribbon */}
        <div className="flex flex-col items-center gap-1.5 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 border border-amber-300 text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Interactive Save the Date</span>
          </div>
          <h3
            className="text-2xl sm:text-3xl font-bold tracking-tight mt-1"
            style={{
              fontFamily: theme.fontFamily.heading,
              color: theme.colors.textHeading,
            }}
          >
            Scratch to Reveal Our Date
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md">
            Rub with your finger on phone or drag mouse to scratch off the golden cards!
          </p>
        </div>

        {/* Scratch Card Canvas Stage */}
        <div
          ref={containerRef}
          className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-inner border-2 border-amber-300 select-none touch-none mx-auto bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center"
        >
          {/* UNDERNEATH LAYER: 3 Revealed Cards matching video 0:06 */}
          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-center select-text">
            {/* Top Auspicious Inscription */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm">🪔</span>
              <span className="text-xs font-bold tracking-widest text-amber-800 uppercase font-serif">
                ॥ शुभ विवाह मुहूर्त ॥
              </span>
              <span className="text-sm">🪔</span>
            </div>

            {/* 3 Revealed Cards Side-by-Side */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full my-auto px-1 sm:px-2">
              {/* DAY */}
              <div className="rounded-xl border border-amber-300 bg-white/95 p-2 sm:p-3 shadow-md flex flex-col items-center justify-center">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-800">DAY</span>
                <span className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif my-0.5">{dateParts.day}</span>
              </div>
              {/* MONTH */}
              <div className="rounded-xl border border-amber-300 bg-white/95 p-2 sm:p-3 shadow-md flex flex-col items-center justify-center">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-800">MONTH</span>
                <span className="text-xs sm:text-base font-extrabold text-stone-900 font-serif my-0.5 truncate max-w-full">{dateParts.month}</span>
              </div>
              {/* YEAR */}
              <div className="rounded-xl border border-amber-300 bg-white/95 p-2 sm:p-3 shadow-md flex flex-col items-center justify-center">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-800">YEAR</span>
                <span className="text-lg sm:text-2xl font-extrabold text-stone-900 font-serif my-0.5">{dateParts.year}</span>
              </div>
            </div>

            {/* Venue & Muhurat Specs */}
            <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-amber-200 text-stone-700 text-xs">
              <div className="flex items-center justify-center gap-1 truncate">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{targetEvent?.time || '03:30 PM'} Onwards</span>
              </div>
              <div className="flex items-center justify-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{targetEvent?.venue?.name || targetEvent?.venueName || 'Lake Palace, Udaipur'}</span>
              </div>
            </div>
          </div>

          {/* TOP LAYER: Golden Scratch Canvas with Touch-Action None */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`absolute inset-0 w-full h-full cursor-pointer z-10 ${
              isScratched ? 'pointer-events-none' : ''
            }`}
            style={{ touchAction: 'none' }}
          />

          {/* Sparkle Dust Flyaway Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none z-20 rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                opacity: p.alpha,
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          ))}
        </div>

        {/* Scratch Progress & Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Progress bar */}
          <div className="w-full sm:w-1/2 flex items-center gap-2">
            <span className="font-semibold text-stone-600 shrink-0 text-[11px]">
              {isScratched ? 'Revealed!' : `${scratchPercent}% Scratched`}
            </span>
            <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(scratchPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isScratched ? (
              <button
                onClick={triggerFullReveal}
                className="px-4 py-1.5 rounded-full font-bold text-xs bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reveal Instantly ✨</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={createGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Add to Calendar</span>
                </a>
                <button
                  onClick={handleResetCard}
                  className="px-3 py-1.5 rounded-full font-semibold text-xs border border-stone-300 hover:bg-stone-100 text-stone-700 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="Scratch again"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
