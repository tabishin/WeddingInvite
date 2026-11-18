import React, { useState, useEffect } from 'react';
import { WeddingTheme, DoorOpeningConfig } from '../../types/wedding';
import { Sparkles, ChevronRight, Volume2, VolumeX, Eye } from 'lucide-react';

interface RoyalDoorOpeningProps {
  theme: WeddingTheme;
  coupleTitle: string;
  partner1: string;
  partner2: string;
  weddingDateFormatted: string;
  onOpenComplete?: () => void;
  isOpenState?: boolean; // if controlled externally
  isModalPreview?: boolean;
  onClosePreview?: () => void;
  destinationCity?: string;
}

export const RoyalDoorOpening: React.FC<RoyalDoorOpeningProps> = ({
  theme,
  coupleTitle,
  partner1,
  partner2,
  weddingDateFormatted,
  onOpenComplete,
  isModalPreview = false,
  onClosePreview,
  destinationCity,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  const doorConfig: DoorOpeningConfig = theme.doorOpeningConfig || {
    style: 'rajput-haveli',
    title: 'Royal Rajputana Haveli Gates',
    subtitle: 'Step into a royal realm of heritage and grandeur',
    culturalType: 'hindu',
    archShape: 'rajasthani-jharokha',
    doorColorPrimary: '#451A03',
    doorColorSecondary: '#78350F',
    goldTrimColor: '#D4AF37',
    knockerType: 'sun-crest',
    toranOrGarland: 'marigold',
    motifs: ['elephant', 'peacock', 'brass-studs'],
  };

  // Play auspicious entrance chime using browser Web Audio API
  const playEntranceChime = () => {
    if (isSoundMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const now = ctx.currentTime;
      // Arpeggiated golden temple harp / wind chime chord (C5, E5, G5, B5, D6)
      const frequencies = [523.25, 659.25, 783.99, 987.77, 1174.66];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 2.0);
      });
    } catch {
      // Audio context might be restricted before gesture, safe ignore
    }
  };

  const handleOpenDoors = () => {
    if (isOpening || isOpen) return;
    setIsOpening(true);
    playEntranceChime();

    // Trigger door swing
    setTimeout(() => {
      setIsOpen(true);
    }, 100);

    // After animation completes, signal completion
    setTimeout(() => {
      setIsOpening(false);
      if (!isModalPreview) {
        setHasDismissed(true);
      }
      if (onOpenComplete) {
        onOpenComplete();
      }
    }, 1800);
  };

  const handleReplay = () => {
    setIsOpen(false);
    setIsOpening(false);
    setHasDismissed(false);
  };

  if (hasDismissed && !isModalPreview) {
    return null;
  }

  // Get initials for the royal central crest
  const initial1 = partner1 ? partner1.charAt(0).toUpperCase() : 'S';
  const initial2 = partner2 ? partner2.charAt(0).toUpperCase() : 'A';

  // Architectural arch styling based on cultural heritage
  const renderArchTop = () => {
    switch (doorConfig.archShape) {
      case 'scalloped-mughal':
        // Scalloped multi-foil Mughal Nawabi arch
        return (
          <div className="relative w-full h-24 sm:h-32 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 800 200" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mughalArchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#064E3B" />
                  <stop offset="50%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#064E3B" />
                </linearGradient>
                <linearGradient id="goldFiligree" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#FEF08A" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
              <path
                d="M 0,200 L 0,100 Q 100,100 150,70 Q 200,40 250,70 Q 300,100 350,50 Q 400,0 450,50 Q 500,100 550,70 Q 600,40 650,70 Q 700,100 800,100 L 800,200 Z"
                fill="url(#mughalArchGrad)"
                stroke="url(#goldFiligree)"
                strokeWidth="4"
              />
              {/* Islamic Calligraphy / Floral Medallion */}
              <circle cx="400" cy="80" r="28" fill="#064E3B" stroke="url(#goldFiligree)" strokeWidth="3" />
              <text x="400" y="86" fill="#FDE68A" fontSize="18" textAnchor="middle" fontFamily="serif" fontWeight="bold">
                ﷽
              </text>
            </svg>
            {/* Hanging Mogra / Jasmine Floral Strings */}
            {doorConfig.toranOrGarland === 'jasmine' && (
              <div className="absolute -bottom-2 inset-x-0 flex justify-around pointer-events-none px-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                    <div className="w-1.5 h-6 bg-emerald-800" />
                    <span className="text-xs">🌸</span>
                    <span className="text-xs">🤍</span>
                    <span className="text-[10px]">✨</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'horseshoe-arabesque':
        // Andalusian / Moroccan horseshoe arch
        return (
          <div className="relative w-full h-24 sm:h-32 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,200 L 0,120 C 100,120 180,60 280,30 C 350,10 400,0 450,10 C 550,30 620,120 800,120 L 800,200 Z"
                fill="#1E3A8A"
                stroke="#F59E0B"
                strokeWidth="4"
              />
              <circle cx="400" cy="70" r="26" fill="#1E3A8A" stroke="#F59E0B" strokeWidth="2.5" />
              <text x="400" y="78" fill="#FDE68A" fontSize="20" textAnchor="middle">
                ☪
              </text>
            </svg>
          </div>
        );

      case 'temple-gopuram':
        // South Indian Gopuram carved tier with temple bells
        return (
          <div className="relative w-full h-28 sm:h-36 flex flex-col items-center justify-end overflow-hidden">
            <div className="w-24 sm:w-32 h-10 border-t-4 border-amber-400 bg-amber-950 flex items-center justify-center text-amber-300 font-serif font-bold text-xs shadow-lg">
              ॥ शुभ विवाह ॥
            </div>
            <div className="w-full h-12 bg-amber-900 border-y-2 border-amber-400 flex items-center justify-around px-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center text-amber-300">
                  <span className="text-sm">🔔</span>
                  <span className="text-[9px] text-amber-200">ॐ</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'swarna-sun-arch':
        // Exact Image 1: Golden Sun-Crest Gate with Classical Column Capitals topped with Glowing Lanterns
        return (
          <div className="relative w-full h-32 sm:h-40 flex flex-col items-center justify-end overflow-visible">
            {/* Flanking Pillars with Golden Glowing Lanterns */}
            <div className="absolute inset-x-0 top-0 flex justify-between px-2 sm:px-4 z-20 pointer-events-none">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-400/30 blur-md animate-pulse" />
                <div className="w-7 h-9 -mt-7 rounded-t-lg bg-gradient-to-b from-amber-200 via-amber-500 to-amber-900 border-2 border-yellow-200 shadow-[0_0_15px_#F59E0B] flex items-center justify-center">
                  <span className="text-xs animate-bounce">🔥</span>
                </div>
                <div className="w-9 h-2.5 bg-gradient-to-r from-amber-700 via-yellow-400 to-amber-700 rounded-xs shadow-md" />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-400/30 blur-md animate-pulse" />
                <div className="w-7 h-9 -mt-7 rounded-t-lg bg-gradient-to-b from-amber-200 via-amber-500 to-amber-900 border-2 border-yellow-200 shadow-[0_0_15px_#F59E0B] flex items-center justify-center">
                  <span className="text-xs animate-bounce">🔥</span>
                </div>
                <div className="w-9 h-2.5 bg-gradient-to-r from-amber-700 via-yellow-400 to-amber-700 rounded-xs shadow-md" />
              </div>
            </div>

            {/* Radiant Sun-Crest Archway SVG */}
            <svg viewBox="0 0 800 220" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="swarnaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="25%" stopColor="#D97706" />
                  <stop offset="50%" stopColor="#FEF08A" />
                  <stop offset="75%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
                <radialGradient id="sunBurstGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Outer Molded Arch */}
              <path
                d="M 30,220 L 30,150 C 30,55 150,10 400,10 C 650,10 770,55 770,150 L 770,220 Z"
                fill="#1C1917"
                stroke="url(#swarnaGoldGrad)"
                strokeWidth="7"
              />

              {/* Inner Carved Filigree Rib */}
              <path
                d="M 50,220 L 50,155 C 50,75 170,30 400,30 C 630,30 750,75 750,155 L 750,220 Z"
                fill="none"
                stroke="url(#swarnaGoldGrad)"
                strokeWidth="3"
                strokeDasharray="6,4"
              />

              {/* Apex Keystone Sun Medallion */}
              <circle cx="400" cy="46" r="38" fill="#292524" stroke="url(#swarnaGoldGrad)" strokeWidth="3.5" />
              <circle cx="400" cy="46" r="28" fill="url(#sunBurstGlow)" />
              <circle cx="400" cy="46" r="12" fill="#FEF08A" stroke="#B45309" strokeWidth="2" />
            </svg>
          </div>
        );

      case 'carved-stone-scalloped':
        // Exact Image 2: Rajasthani/Mughal Multi-Cusped Scalloped Stone Archway
        return (
          <div className="relative w-full h-32 sm:h-40 flex flex-col items-center justify-end overflow-visible">
            {/* Hanging Floral Garlands of Marigolds & Roses */}
            <div className="absolute top-1 inset-x-0 flex justify-between px-2 sm:px-6 pointer-events-none z-20">
              <div className="flex flex-col items-center">
                <span className="text-base">🌼</span>
                <span className="text-sm -mt-1">🌸</span>
                <span className="text-xs -mt-1">🏵️</span>
                <span className="text-[10px] -mt-1">🍃</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base">🌼</span>
                <span className="text-sm -mt-1">🌸</span>
                <span className="text-xs -mt-1">🏵️</span>
                <span className="text-[10px] -mt-1">🍃</span>
              </div>
            </div>

            {/* Scalloped Cusped Archway SVG */}
            <svg viewBox="0 0 800 220" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="stoneArchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#78350F" />
                  <stop offset="50%" stopColor="#A16207" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
                <linearGradient id="woodTympanum" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2D1810" />
                  <stop offset="100%" stopColor="#1E0E08" />
                </linearGradient>
              </defs>

              {/* Multi-cusped Rajasthani Sandstone Arch */}
              <path
                d="M 20,220 L 20,120 Q 80,120 120,85 Q 160,50 210,70 Q 270,95 320,55 Q 360,25 400,5 Q 440,25 480,55 Q 530,95 590,70 Q 640,50 680,85 Q 720,120 780,120 L 780,220 Z"
                fill="url(#stoneArchGrad)"
                stroke="#FDE68A"
                strokeWidth="5"
              />

              {/* Inner Carved Wooden Floral Tympanum */}
              <path
                d="M 90,220 L 90,150 Q 190,150 290,100 Q 350,70 400,50 Q 450,70 510,100 Q 610,150 710,150 L 710,220 Z"
                fill="url(#woodTympanum)"
                stroke="#B45309"
                strokeWidth="3"
              />

              {/* Auspicious Center Carved Rosette Medallion */}
              <circle cx="400" cy="100" r="26" fill="#3E1C10" stroke="#F59E0B" strokeWidth="2.5" />
              <text x="400" y="107" fill="#FDE68A" fontSize="16" textAnchor="middle" fontWeight="bold">
                ☸
              </text>
            </svg>
          </div>
        );

      case 'rajasthani-jharokha':
      default:
        // Royal Rajputana carved haveli arch with marigold toran
        return (
          <div className="relative w-full h-24 sm:h-32 flex flex-col items-center justify-end overflow-hidden">
            <svg viewBox="0 0 800 180" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,180 L 0,80 Q 200,80 300,40 Q 380,0 400,0 Q 420,0 500,40 Q 600,80 800,80 L 800,180 Z"
                fill="#581C87"
                stroke="#D4AF37"
                strokeWidth="4"
              />
              {/* Royal Sun / Ganesh crest */}
              <circle cx="400" cy="65" r="26" fill="#7E22CE" stroke="#FDE047" strokeWidth="3" />
              <text x="400" y="73" fill="#FEF08A" fontSize="20" textAnchor="middle">
                ☀️
              </text>
            </svg>
            {/* Fresh Marigold Toran Garland */}
            {doorConfig.toranOrGarland === 'marigold' && (
              <div className="absolute bottom-0 inset-x-0 flex justify-between px-3 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-base select-none">🌼</span>
                    <span className="text-xs select-none">🍃</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  // Door surface textures and motifs
  const getDoorSurfaceStyle = () => {
    switch (doorConfig.style) {
      case 'swarna-sun-crest':
        return {
          backgroundColor: '#B45309',
          backgroundImage: `
            radial-gradient(ellipse at 50% 30%, rgba(254, 240, 138, 0.45) 0%, rgba(217, 119, 6, 0.25) 45%, transparent 70%),
            linear-gradient(135deg, #78350F 0%, #B45309 30%, #D97706 60%, #92400E 100%)
          `,
          borderColor: '#FEF08A',
        };
      case 'shahi-teakwood-haveli':
        return {
          backgroundColor: '#291409',
          backgroundImage: `
            linear-gradient(135deg, #1F0D06 0%, #3B1B0E 35%, #291409 70%, #170904 100%)
          `,
          borderColor: '#F59E0B',
        };
      case 'mughal-jali':
        return {
          backgroundColor: '#064E3B',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.25) 10%, transparent 11%),
            linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(4, 120, 87, 0.9) 50%, rgba(6, 78, 59, 0.95) 100%)
          `,
          borderColor: '#D4AF37',
        };
      case 'south-temple-brass':
        return {
          backgroundColor: '#78350F',
          backgroundImage: `
            linear-gradient(135deg, #B45309 0%, #D97706 40%, #92400E 100%)
          `,
          borderColor: '#FDE68A',
        };
      case 'shekhawati-jharokha':
        return {
          backgroundColor: '#0F766E',
          backgroundImage: `
            linear-gradient(135deg, #115E59 0%, #14B8A6 50%, #0F766E 100%)
          `,
          borderColor: '#FEF08A',
        };
      case 'nawabi-emerald-velvet':
        return {
          backgroundColor: '#022C22',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(20, 83, 45, 0.8) 0%, #022C22 100%)
          `,
          borderColor: '#F59E0B',
        };
      case 'andalusian-mashrabiya':
        return {
          backgroundColor: '#1E3A8A',
          backgroundImage: `
            linear-gradient(135deg, #172554 0%, #1E40AF 50%, #1E3A8A 100%)
          `,
          borderColor: '#F59E0B',
        };
      case 'kashmiri-walnut':
        return {
          backgroundColor: '#291409',
          backgroundImage: `
            linear-gradient(135deg, #381A0B 0%, #451E0E 50%, #291409 100%)
          `,
          borderColor: '#D4AF37',
        };
      case 'rajbari-terracotta':
        return {
          backgroundColor: '#7F1D1D',
          backgroundImage: `
            linear-gradient(135deg, #991B1B 0%, #B91C1C 50%, #7F1D1D 100%)
          `,
          borderColor: '#FDE047',
        };
      case 'vedic-sandalwood':
        return {
          backgroundColor: '#713F12',
          backgroundImage: `
            linear-gradient(135deg, #854D0E 0%, #A16207 50%, #713F12 100%)
          `,
          borderColor: '#FDE047',
        };
      case 'rajput-haveli':
      default:
        return {
          backgroundColor: '#451A03',
          backgroundImage: `
            linear-gradient(135deg, #451A03 0%, #78350F 50%, #451A03 100%)
          `,
          borderColor: '#D4AF37',
        };
    }
  };

  // 3D Door Knocker / Handle Icon
  const renderKnocker = (isLeft: boolean) => {
    switch (doorConfig.knockerType) {
      case 'sun-crest':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-amber-300 bg-amber-600 shadow-2xl flex items-center justify-center text-amber-200">
            <span className="text-2xl select-none">☀️</span>
          </div>
        );
      case 'peacock':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-teal-300 bg-teal-800 shadow-2xl flex items-center justify-center text-teal-100">
            <span className="text-2xl select-none">🦚</span>
          </div>
        );
      case 'lotus':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-pink-300 bg-rose-800 shadow-2xl flex items-center justify-center text-pink-100">
            <span className="text-2xl select-none">🪷</span>
          </div>
        );
      case 'crescent-star':
        return (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-amber-300 bg-emerald-900 shadow-2xl flex items-center justify-center text-amber-300">
            <span className="text-2xl select-none">☪</span>
          </div>
        );
      case 'vertical-gold-handles':
        // Exact Image 1: Elegant long vertical curved golden door pull handles
        return (
          <div className="flex flex-col items-center">
            {/* Top golden bracket mount */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-100 to-amber-600 border border-yellow-100 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-900" />
            </div>
            {/* Long vertical ornate golden handle bar */}
            <div className="w-3 sm:w-3.5 h-24 sm:h-32 rounded-full bg-gradient-to-r from-yellow-200 via-amber-400 to-amber-700 shadow-2xl border-x border-yellow-100 my-1 relative flex items-center justify-center">
              <div className="w-0.5 h-3/4 bg-yellow-100/70 rounded-full" />
            </div>
            {/* Bottom golden bracket mount */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-100 to-amber-600 border border-yellow-100 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-900" />
            </div>
          </div>
        );

      case 'brass-sunburst-plate':
        // Exact Image 2: Raised embossed brass sunburst flower medallion
        return (
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-amber-700 via-yellow-400 to-amber-100 border-2 border-yellow-200 shadow-2xl flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-200 to-amber-800 border border-yellow-100 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-950" />
            </div>
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-900/60 pointer-events-none" />
          </div>
        );

      case 'lion-ring':
      case 'mughal-ring':
      default:
        return (
          <div className="flex flex-col items-center">
            {/* Stud mount */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 border-2 border-amber-200 shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-amber-900" />
            </div>
            {/* Swinging heavy brass ring */}
            <div className={`w-12 h-16 sm:w-14 sm:h-20 -mt-2 border-4 border-amber-300 rounded-b-full shadow-2xl bg-amber-400/10 transition-transform duration-300 ${
              isOpening ? (isLeft ? '-rotate-12' : 'rotate-12') : 'hover:scale-105'
            }`} />
          </div>
        );
    }
  };

  const doorStyle = getDoorSurfaceStyle();

  // Saath Studio inspired tactile opening styles
  const isEnvelope = doorConfig.style === 'ivory-wax-envelope' || doorConfig.style === 'zardozi-velvet-envelope';
  const isCurtains = doorConfig.style === 'parda-velvet-curtains';

  // 1. Tactile Wax-Sealed Envelope Stage (Saath Studio Ivory / Zardozi style)
  const renderEnvelopeStage = () => {
    const isIvory = doorConfig.style === 'ivory-wax-envelope';
    const envBg = isIvory
      ? 'linear-gradient(135deg, #FAF7F2 0%, #F3EDE4 50%, #ECE3D6 100%)'
      : 'linear-gradient(135deg, #4A0E17 0%, #35080E 50%, #1F0408 100%)';
    const envBorder = isIvory ? '#D4AF37' : '#E5C07B';
    const flapColor = isIvory ? '#F5EFEB' : '#3E0A12';
    const sealColor = isIvory ? '#8B0000' : '#D4AF37';
    const sealTextColor = isIvory ? '#FDE68A' : '#4A0E17';

    return (
      <div className="relative w-full max-w-md sm:max-w-lg h-[390px] sm:h-[450px] flex items-center justify-center p-3 sm:p-4">
        {/* The Outer Envelope Body */}
        <div
          className="relative w-full h-full rounded-2xl shadow-2xl border-2 overflow-hidden flex flex-col justify-end"
          style={{
            background: envBg,
            borderColor: envBorder,
            boxShadow: `0 25px 60px -10px rgba(0,0,0,0.8), 0 0 35px ${envBorder}40`,
            perspective: '1200px',
          }}
        >
          {/* Subtle chikankari or zardozi decorative foil watermark */}
          <div className="absolute inset-2 sm:inset-3 rounded-xl border border-dashed opacity-40 pointer-events-none" style={{ borderColor: envBorder }} />
          
          {/* Golden Corner Flourishes */}
          <div className="absolute top-3 left-3 text-sm opacity-60 select-none">⚜️</div>
          <div className="absolute top-3 right-3 text-sm opacity-60 select-none">⚜️</div>
          <div className="absolute bottom-3 left-3 text-sm opacity-60 select-none">⚜️</div>
          <div className="absolute bottom-3 right-3 text-sm opacity-60 select-none">⚜️</div>

          {/* Inner Invitation Card that slides up */}
          <div
            className={`absolute inset-x-4 sm:inset-x-6 top-8 bottom-4 rounded-xl shadow-xl p-6 text-center flex flex-col items-center justify-center border transition-all duration-1000 ease-out z-10 ${
              isOpen ? '-translate-y-20 sm:-translate-y-24 shadow-2xl scale-[1.02]' : 'translate-y-0 opacity-0'
            }`}
            style={{
              background: theme.colors.cardBg,
              borderColor: theme.colors.goldOrMetallic,
              boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
            }}
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-amber-600 block mb-1">
              With the Grace of the Almighty
            </span>
            <h3
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-1"
              style={{
                fontFamily: theme.fontFamily.heading,
                color: theme.colors.textHeading,
              }}
            >
              {coupleTitle}
            </h3>
            <p
              className="text-base sm:text-lg italic"
              style={{
                fontFamily: theme.fontFamily.script,
                color: theme.colors.primary,
              }}
            >
              {weddingDateFormatted}
            </p>
            <p className="text-[11px] text-stone-600 max-w-xs mx-auto mt-2 italic">
              {theme.tagline}
            </p>
          </div>

          {/* Lower Pocket Triangular Flaps (Front of envelope) */}
          <div
            className="absolute inset-x-0 bottom-0 h-48 sm:h-56 z-20 pointer-events-none"
            style={{
              clipPath: 'polygon(0 100%, 50% 28%, 100% 100%)',
              background: isIvory ? '#EDE4D6' : '#28050A',
              borderTop: `1px solid ${envBorder}88`,
            }}
          />

          {/* Top Envelope Flap that flips up */}
          <div
            className="absolute inset-x-0 top-0 h-48 sm:h-56 z-30 transition-transform duration-1000 origin-top shadow-xl flex items-center justify-center cursor-pointer"
            onClick={handleOpenDoors}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              background: flapColor,
              transform: isOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
              transformStyle: 'preserve-3d',
              borderBottom: `2px solid ${envBorder}`,
            }}
          >
            <div className="absolute top-4 text-[11px] font-serif text-amber-700/70 uppercase tracking-widest">
              {isIvory ? '✦ Royal Khidmat ✦' : '✦ Shahi Dawat ✦'}
            </div>
          </div>

          {/* Authentic 3D Monogram Wax Seal (Clickable) */}
          <div
            onClick={handleOpenDoors}
            className={`absolute left-1/2 top-44 sm:top-52 -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-700 cursor-pointer group ${
              isOpen ? 'scale-150 opacity-0 pointer-events-none' : 'scale-100 opacity-100 hover:scale-105 active:scale-95'
            }`}
            title="Click to break the wax seal and open"
          >
            {/* Glowing aura */}
            <div className="absolute -inset-3 rounded-full bg-amber-400/35 blur-md animate-pulse" />

            {/* Realistic wax seal medallion disk */}
            <div
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 select-none"
              style={{
                background: sealColor,
                borderColor: envBorder,
                boxShadow: `0 12px 25px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.5)`,
                color: sealTextColor,
              }}
            >
              {/* Outer decorative rim with dots */}
              <div className="absolute inset-1 rounded-full border border-dashed border-amber-200/50 pointer-events-none" />

              <span className="font-serif font-extrabold text-sm sm:text-base tracking-wider drop-shadow-sm">
                {initial1}&{initial2}
              </span>
              <span className="text-[7px] uppercase tracking-widest font-sans font-bold opacity-80 mt-0.5">
                SEAL
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Theatrical Velvet Curtains Stage (Saath Studio Parda style)
  const renderCurtainsStage = () => {
    return (
      <div className="relative w-full max-w-xl sm:max-w-2xl h-[520px] sm:h-[580px] rounded-3xl border-4 border-amber-500 shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Crystal Chandelier at top */}
        <div className="absolute top-0 inset-x-0 h-32 flex flex-col items-center justify-start z-30 pointer-events-none">
          {/* Chain */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-amber-200 to-amber-500" />
          {/* Multi-tier Chandelier Frame */}
          <div className="relative flex flex-col items-center">
            {/* Top crown */}
            <div className="w-16 h-3 rounded-full bg-gradient-to-r from-yellow-100 via-amber-400 to-yellow-100 border border-yellow-200 shadow-md" />
            {/* Mid tier with crystals */}
            <div className="w-28 h-5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 border border-yellow-100 shadow-lg flex items-center justify-around px-2 -mt-0.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-1.5 h-3 bg-white/90 rounded-full shadow-xs animate-pulse" style={{ animationDelay: `${i * 180}ms` }} />
              ))}
            </div>
            {/* Warm chandelier glow */}
            <div className="absolute -inset-10 rounded-full bg-amber-400/25 blur-xl pointer-events-none" />
          </div>
          {/* Golden Pelmet with velvet scalloping */}
          <div className="w-full h-8 bg-gradient-to-r from-red-950 via-amber-800 to-red-950 border-b-2 border-yellow-400 shadow-lg flex items-center justify-around px-2 mt-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="text-amber-300 text-xs">▼</span>
            ))}
          </div>
        </div>

        {/* Revealed Stage with the Invitation Details (Behind curtains) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
          style={{ background: theme.colors.backgroundGradient }}
        >
          <div className="space-y-4 max-w-md animate-in fade-in zoom-in duration-1000">
            <span className="text-xs uppercase tracking-widest font-bold text-amber-600 block">
              Welcome to the Grand Celebration
            </span>
            <h1
              className="text-3xl sm:text-4xl font-bold"
              style={{
                fontFamily: theme.fontFamily.heading,
                color: theme.colors.textHeading,
              }}
            >
              {coupleTitle}
            </h1>
            <p
              className="text-lg italic"
              style={{
                fontFamily: theme.fontFamily.script,
                color: theme.colors.primary,
              }}
            >
              {weddingDateFormatted}
            </p>
            <p className="text-xs text-stone-600 max-w-xs mx-auto">
              {theme.tagline}
            </p>
          </div>
        </div>

        {/* LEFT VELVET CURTAIN PANEL */}
        <div
          onClick={handleOpenDoors}
          className="absolute inset-y-0 left-0 w-1/2 cursor-pointer z-20 transition-transform duration-1000 ease-out shadow-2xl flex flex-col justify-between overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #3B070E 0%, #7F1D1D 20%, #991B1B 45%, #5B0D18 65%, #991B1B 85%, #3B070E 100%)',
            transform: isOpen ? 'translateX(-85%) scaleX(0.4)' : 'translateX(0%) scaleX(1)',
            transformOrigin: 'left center',
            boxShadow: 'inset -15px 0 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Vertical Pleats Overlay */}
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.6)_0px,transparent_14px,rgba(255,255,255,0.15)_28px,rgba(0,0,0,0.6)_42px)] pointer-events-none" />
          {/* Golden Hem Bullion Fringe */}
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 border-t border-amber-600" />
        </div>

        {/* RIGHT VELVET CURTAIN PANEL */}
        <div
          onClick={handleOpenDoors}
          className="absolute inset-y-0 right-0 w-1/2 cursor-pointer z-20 transition-transform duration-1000 ease-out shadow-2xl flex flex-col justify-between overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, #3B070E 0%, #7F1D1D 20%, #991B1B 45%, #5B0D18 65%, #991B1B 85%, #3B070E 100%)',
            transform: isOpen ? 'translateX(85%) scaleX(0.4)' : 'translateX(0%) scaleX(1)',
            transformOrigin: 'right center',
            boxShadow: 'inset 15px 0 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Vertical Pleats Overlay */}
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.6)_0px,transparent_14px,rgba(255,255,255,0.15)_28px,rgba(0,0,0,0.6)_42px)] pointer-events-none" />
          {/* Golden Hem Bullion Fringe */}
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 border-t border-amber-600" />
        </div>

        {/* Center Golden Medallion Crest */}
        <div
          onClick={handleOpenDoors}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500 cursor-pointer ${
            isOpen ? 'scale-150 opacity-0 pointer-events-none' : 'scale-100 opacity-100 hover:scale-105 active:scale-95'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-4 rounded-full bg-amber-400/30 blur-md animate-pulse" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-4 border-amber-100 shadow-2xl flex flex-col items-center justify-center text-stone-900 font-serif font-bold">
              <span className="text-sm sm:text-base tracking-wider">
                {initial1}&{initial2}
              </span>
              <span className="text-[8px] uppercase tracking-widest font-sans font-bold text-amber-950 mt-0.5">
                ENTER
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. Authentic Saath Studio Painted Rajputana Jharokha Haveli Entrance (Exact reference image_555e6d52.png)
  const renderHaveliStage = () => {
    const destinationSubtitle = destinationCity
      ? `TO A WEDDING IN ${destinationCity.toUpperCase()}`
      : 'TO A WEDDING IN UDAIPUR';

    return (
      <div className="relative w-full flex flex-col items-center justify-center">
        {/* The Authentic Vertical Haveli Frame matching Image 2 */}
        <div
          onClick={handleOpenDoors}
          className="relative w-full max-w-[420px] aspect-[1024/1536] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl cursor-pointer select-none transition-transform duration-500 hover:scale-[1.01] active:scale-[0.99] border border-amber-950/40"
          style={{
            perspective: '1400px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.95), 0 0 50px rgba(212, 175, 55, 0.12)',
          }}
        >
          {/* 1. Underlying Illuminated Courtyard Background (revealed as doors swing open) */}
          <img
            src="/assets/themes/jharokha/open.webp"
            alt="Royal Courtyard"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Warm golden light ambient flare inside courtyard */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: 'radial-gradient(ellipse at 50% 60%, rgba(254, 240, 138, 0.35) 0%, rgba(217, 119, 6, 0.15) 50%, transparent 80%)',
            }}
          />

          {/* 2. Closed Stone Facade & Static Carved Archway Frame */}
          <img
            src="/assets/themes/jharokha/closed.webp"
            alt="Rajputana Haveli Entrance"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-5"
          />

          {/* 3. Dual 3D Swinging Door Leaves */}
          {/* LEFT DOOR LEAF */}
          <div
            className="absolute overflow-hidden z-10"
            style={{
              left: '23.63%',
              top: '36.33%',
              width: '26.27%',
              height: '48.11%',
              transformOrigin: '0% 50%',
              transform: isOpen
                ? 'perspective(1400px) rotateY(96deg)'
                : 'perspective(1400px) rotateY(0deg)',
              transition: 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <img
              src="/assets/themes/jharokha/closed.webp"
              alt="Left Door Leaf"
              className="absolute pointer-events-none select-none max-w-none"
              style={{
                width: `${100 / 0.2627}%`,
                height: `${100 / 0.4811}%`,
                left: `-${23.63 / 0.2627}%`,
                top: `-${36.33 / 0.4811}%`,
              }}
            />
            {/* Realistic 3D edge shadow */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
                isOpen ? 'opacity-20' : 'opacity-100'
              }`}
              style={{
                boxShadow: 'inset -8px 0 15px rgba(0,0,0,0.65)',
              }}
            />
          </div>

          {/* RIGHT DOOR LEAF */}
          <div
            className="absolute overflow-hidden z-10"
            style={{
              left: '49.9%',
              top: '36.33%',
              width: '26.47%',
              height: '48.11%',
              transformOrigin: '100% 50%',
              transform: isOpen
                ? 'perspective(1400px) rotateY(-96deg)'
                : 'perspective(1400px) rotateY(0deg)',
              transition: 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <img
              src="/assets/themes/jharokha/closed.webp"
              alt="Right Door Leaf"
              className="absolute pointer-events-none select-none max-w-none"
              style={{
                width: `${100 / 0.2647}%`,
                height: `${100 / 0.4811}%`,
                left: `-${49.9 / 0.2647}%`,
                top: `-${36.33 / 0.4811}%`,
              }}
            />
            {/* Realistic 3D edge shadow */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
                isOpen ? 'opacity-20' : 'opacity-100'
              }`}
              style={{
                boxShadow: 'inset 8px 0 15px rgba(0,0,0,0.65)',
              }}
            />
          </div>

          {/* 4. Center Golden Light Seam with Breathing Glow */}
          <div
            className={`absolute z-15 pointer-events-none transition-all duration-700 ${
              isOpen ? 'opacity-0 scale-x-150' : 'opacity-100 animate-pulse'
            }`}
            style={{
              left: '49.6%',
              top: '36.33%',
              width: '0.8%',
              height: '48.11%',
              background: 'linear-gradient(180deg, rgba(254, 240, 138, 0.9) 0%, rgba(245, 158, 11, 1) 50%, rgba(254, 240, 138, 0.9) 100%)',
              boxShadow: '0 0 12px 2px rgba(254, 240, 138, 0.85), 0 0 24px 6px rgba(245, 158, 11, 0.6)',
            }}
          />

          {/* 5. Foreground Threshold with Burning Clay Diyas & Marigolds (Anchored in front!) */}
          <img
            src="/assets/themes/jharokha/fore.webp"
            alt="Threshold Diyas and Marigolds"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-20"
          />

          {/* Real Warm Diya Flicker Glow Effect over the diyas */}
          <div
            className="absolute inset-x-0 bottom-[13%] h-12 pointer-events-none z-22 opacity-75 mix-blend-screen animate-pulse"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 80%)',
            }}
          />

          {/* 6. Top Typography (Exact matching image_555e6d52.png) */}
          <div className="absolute top-7 sm:top-10 inset-x-0 flex flex-col items-center justify-center text-center z-30 pointer-events-none px-4">
            <p
              className="text-3xl sm:text-4xl text-amber-200/95 font-serif italic tracking-wide"
              style={{
                fontFamily: "'Great Vibes', cursive",
                textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 0 15px rgba(245, 158, 11, 0.4)',
              }}
            >
              You're invited
            </p>
            <p
              className="mt-1 text-[10.5px] sm:text-xs font-serif uppercase tracking-[0.22em] text-amber-100/90 font-medium"
              style={{
                textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              }}
            >
              {destinationSubtitle}
            </p>
          </div>

          {/* 7. Bottom Typography (Exact matching image_555e6d52.png) */}
          <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex flex-col items-center justify-center text-center z-30 pointer-events-none px-4">
            <p
              className="text-xs sm:text-sm text-amber-100/90 font-serif italic tracking-wide animate-pulse"
              style={{
                textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(251, 191, 36, 0.4)',
              }}
            >
              {isOpen ? 'Entering the celebration...' : 'Tap the doors to open'}
            </p>
          </div>
        </div>

        {/* Small subtle replay control when previewing in modal */}
        {isOpen && isModalPreview && (
          <div className="mt-4 flex items-center gap-3 z-30">
            <button
              onClick={handleReplay}
              className="px-4 py-2 rounded-full text-xs font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🔄 Replay Doors</span>
            </button>
            {onClosePreview && (
              <button
                onClick={onClosePreview}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              >
                Done Previewing
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-700 ${
        isModalPreview ? 'bg-black/95 backdrop-blur-md' : 'bg-[#0E0B12]'
      } ${isOpen && !isModalPreview ? 'pointer-events-none opacity-0 delay-1000' : 'opacity-100'}`}
      style={{ perspective: '1400px' }}
    >
      {/* Top Utility Bar: Audio toggle & Skip to invitation */}
      <div className="absolute top-4 inset-x-4 z-50 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20 text-amber-300">
            {isEnvelope
              ? doorConfig.style === 'ivory-wax-envelope'
                ? '✉️ Lucknowi Chikankari Wax-Sealed Envelope'
                : '✉️ Royal Zardozi Velvet Envelope'
              : isCurtains
              ? '🎭 Royal Court Velvet Curtains'
              : doorConfig.culturalType === 'hindu'
              ? '🛕 Vedic Royal Gates'
              : doorConfig.culturalType === 'muslim'
              ? '🕌 Shahi Nawabi Darwaza'
              : '✨ Royal Grand Gates'}
          </span>
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-colors"
            title={isSoundMuted ? 'Unmute entrance chime' : 'Mute entrance chime'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isModalPreview && onClosePreview && (
            <button
              onClick={onClosePreview}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-stone-200"
            >
              Close Preview ✕
            </button>
          )}

          {!isModalPreview && (
            <button
              onClick={() => {
                setHasDismissed(true);
                if (onOpenComplete) onOpenComplete();
              }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-amber-200 hover:text-white flex items-center gap-1"
            >
              <span>Skip to Invitation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Arch & Grand 3D Doors Container */}
      <div className="relative w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 flex flex-col items-center">
        {/* Render Opening Stage Based on Theme Style */}
        {isEnvelope ? (
          renderEnvelopeStage()
        ) : isCurtains ? (
          renderCurtainsStage()
        ) : (
          renderHaveliStage()
        )}

        {/* Bottom Interactive CTA Trigger & Instructions (Envelope or Curtains only) */}
        {(isEnvelope || isCurtains) && (
          <div className="mt-6 flex flex-col items-center gap-3 text-center z-30">
            {!isOpen ? (
              <button
                onClick={handleOpenDoors}
                disabled={isOpening}
                className="group relative px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-bold text-sm sm:text-base text-stone-900 shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  boxShadow: '0 10px 30px -5px rgba(245, 158, 11, 0.5), 0 0 20px rgba(253, 230, 138, 0.4)',
                }}
              >
                <Sparkles className="w-5 h-5 text-amber-950 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="font-extrabold tracking-wide uppercase text-xs sm:text-sm text-stone-950">
                  {isEnvelope ? '✉️ Tap Wax Seal to Open' : '🎭 Tap Velvet Curtains to Enter'}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-950 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReplay}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/40 transition-all flex items-center gap-2"
                >
                  <span>{isEnvelope ? '🔄 Close & Reseal Envelope' : '🔄 Close & Replay Curtains'}</span>
                </button>
                {isModalPreview && onClosePreview && (
                  <button
                    onClick={onClosePreview}
                    className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-stone-900 hover:bg-stone-100 transition-all"
                  >
                    Done Previewing
                  </button>
                )}
              </div>
            )}

            <p className="text-[11px] text-amber-200/80 max-w-xs leading-relaxed">
              {isEnvelope
                ? 'Touch the authentic wax seal to break the monogram and unwrap the invitation'
                : 'Touch the royal velvet curtains to step onto the grand celebration stage'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
