import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  Navigation, 
  Share2, 
  Shirt, 
  Car, 
  CalendarPlus, 
  ChevronDown,
  Building,
  TreePine,
  CheckCircle2
} from 'lucide-react';
import { WeddingEvent, WeddingTheme } from '../../types/wedding';
import { generateGoogleCalendarUrl, downloadICalendar } from '../../services/storage';
import { 
  isThemeOrBackgroundDark, 
  getThemeTimingColor, 
  getThemeAddressColor, 
  getThemeHeadingColor, 
  getThemeLabelColor 
} from '../../services/colorUtils';

interface EventCardProps {
  event: WeddingEvent;
  theme: WeddingTheme;
  coupleNames: string;
  index: number;
  customTypography?: {
    headingFont?: string;
    scriptFont?: string;
    bodyFont?: string;
  };
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  theme,
  coupleNames,
  index,
  customTypography,
}) => {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const headingFont = customTypography?.headingFont || theme.fontFamily.heading;
  const scriptFont = customTypography?.scriptFont || theme.fontFamily.script;
  const bodyFont = customTypography?.bodyFont || theme.fontFamily.body;

  // Determine if background or card surface is dark
  const isDarkBg = isThemeOrBackgroundDark(theme);

  // Timing text color: When background is dark, use a bright, vibrant color matching the theme (gold/accent)
  const timingColor = getThemeTimingColor(theme);

  // Address text color: When background is dark, ensure high contrast light color matching the theme
  const addressColor = getThemeAddressColor(theme);

  // Heading color for dates & venue names: ensure light/bright when dark
  const headingColor = getThemeHeadingColor(theme);

  // Label color (Date & Timing, Location & Venue)
  const labelMutedColor = getThemeLabelColor(theme);

  const googleCalUrl = generateGoogleCalendarUrl(event, coupleNames);

  const handleDownloadIcs = () => {
    downloadICalendar(event, coupleNames);
    setAddedSuccess(true);
    setShowCalendarMenu(false);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const getEventBadge = () => {
    // 1. If host defined customCategoryLabel or custom icon, prioritize them
    const customLabel = event.customCategoryLabel?.trim();
    const customIcon = event.icon?.trim();

    let defaultLabel = 'Sacred Ceremony';
    let defaultIcon = '💍';

    switch (event.category) {
      case 'nikah':
        defaultLabel = 'Sacred Nikah Ceremony';
        defaultIcon = '🌙';
        break;
      case 'walima':
        defaultLabel = 'Walima Banquet';
        defaultIcon = '🍽️';
        break;
      case 'mayun':
        defaultLabel = 'Mayun & Ubtan Ritual';
        defaultIcon = '🟡';
        break;
      case 'haldi':
        defaultLabel = 'Haldi Ceremony';
        defaultIcon = '🟡';
        break;
      case 'mehndi':
        defaultLabel = 'Mehndi Celebration';
        defaultIcon = '🌿';
        break;
      case 'sangeet':
        defaultLabel = 'Sangeet & Dance';
        defaultIcon = '🪩';
        break;
      case 'baraat':
        defaultLabel = 'Royal Baraat';
        defaultIcon = '🐎';
        break;
      case 'pheras':
        defaultLabel = 'Sacred Ceremony & Vows';
        defaultIcon = '💍';
        break;
      case 'dinner':
        defaultLabel = 'Celebration Dinner';
        defaultIcon = '🍽️';
        break;
      case 'cocktail':
        defaultLabel = 'Welcome Social Hour';
        defaultIcon = '✨';
        break;
      case 'brunch':
        defaultLabel = 'Farewell Brunch';
        defaultIcon = '🥞';
        break;
      case 'reception':
        defaultLabel = 'The Evening Reception';
        defaultIcon = '🍽️';
        break;
      case 'ceremony':
        defaultLabel = 'The Wedding Ceremony';
        defaultIcon = '💍';
        break;
      default:
        if (event.type === 'wedding') {
          defaultLabel = 'The Wedding Ceremony';
          defaultIcon = '💍';
        } else if (event.type === 'reception') {
          defaultLabel = 'The Evening Reception';
          defaultIcon = '🍽️';
        } else {
          defaultLabel = event.name || 'Special Celebration';
          defaultIcon = '✨';
        }
        break;
    }

    return {
      label: customLabel || defaultLabel,
      icon: customIcon || defaultIcon,
    };
  };

  // Saath Studio inspired function-specific ceremonial moods
  const getCategoryMood = () => {
    switch (event.category) {
      case 'haldi':
      case 'mayun':
        return {
          accent: '#E9A61C',
          badgeBg: '#FEF3C7',
          badgeText: '#92400E',
          borderColor: '#FCD34D',
          gradient: 'linear-gradient(90deg, #F59E0B 0%, #E9A61C 50%, #FDE68A 100%)',
        };
      case 'mehndi':
        return {
          accent: '#5B7B2F',
          badgeBg: '#ECFDF5',
          badgeText: '#065F46',
          borderColor: '#A7F3D0',
          gradient: 'linear-gradient(90deg, #059669 0%, #5B7B2F 50%, #6EE7B7 100%)',
        };
      case 'sangeet':
        return {
          accent: '#D6457A',
          badgeBg: '#FDF2F8',
          badgeText: '#9D174D',
          borderColor: '#FBCFE8',
          gradient: 'linear-gradient(90deg, #DB2777 0%, #7C3AED 50%, #F472B6 100%)',
        };
      case 'nikah':
      case 'pheras':
      case 'ceremony':
        return {
          accent: '#B3261E',
          badgeBg: '#FEF2F2',
          badgeText: '#991B1B',
          borderColor: '#FECACA',
          gradient: 'linear-gradient(90deg, #D4AF37 0%, #B3261E 50%, #DC2626 100%)',
        };
      case 'reception':
      case 'walima':
      case 'dinner':
        return {
          accent: '#C2933F',
          badgeBg: '#FFFBEB',
          badgeText: '#78350F',
          borderColor: '#FDE68A',
          gradient: 'linear-gradient(90deg, #D4AF37 0%, #F59E0B 50%, #FEF08A 100%)',
        };
      default:
        return {
          accent: theme.colors.primary,
          badgeBg: theme.colors.badgeBg,
          badgeText: theme.colors.badgeText,
          borderColor: theme.colors.cardBorder,
          gradient: `linear-gradient(90deg, ${theme.colors.goldOrMetallic} 0%, ${theme.colors.primary} 50%, ${theme.colors.secondary} 100%)`,
        };
    }
  };

  const badge = getEventBadge();
  const categoryMood = getCategoryMood();

  // Authentic Rajasthani Miniature Artworks (matching Saath Studio Jharokha reference)
  const getTraditionalPainting = () => {
    const cat = (event.category || event.type || '').toLowerCase();
    const name = (event.name || '').toLowerCase();
    if (name.includes('mehendi') || cat.includes('mehendi') || name.includes('mehndi')) {
      return '/assets/themes/jharokha/fn-mehendi.webp';
    }
    if (name.includes('sangeet') || cat.includes('sangeet') || name.includes('music')) {
      return '/assets/themes/jharokha/fn-sangeet.webp';
    }
    if (name.includes('wedding') || name.includes('phera') || name.includes('shaadi') || name.includes('ceremony') || cat.includes('ceremony') || cat.includes('pheras') || cat.includes('nikah')) {
      return '/assets/themes/jharokha/fn-wedding.webp';
    }
    if (name.includes('reception') || name.includes('walima') || name.includes('dinner')) {
      return '/assets/themes/jharokha/venue.webp';
    }
    return null;
  };

  const traditionalArt = (theme.id === 'rajput-haveli-doors' || theme.id.includes('haveli')) ? getTraditionalPainting() : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: theme.colors.cardBorder,
        boxShadow: theme.decorations.cardShadow,
      }}
    >
      {/* Authentic Miniature Painting Artwork Header for Jharokha Haveli Theme */}
      {traditionalArt && (
        <div className="relative w-full h-36 sm:h-48 overflow-hidden border-b border-amber-900/30">
          <img
            src={traditionalArt}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-amber-200 border border-amber-300/40">
            Miniature Painting • Udaipur
          </div>
        </div>
      )}

      {/* Decorative top header accent line with ceremonial mood */}
      <div 
        className="h-2 w-full"
        style={{ 
          background: categoryMood.gradient,
        }}
      />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Top Tag & Event Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: theme.colors.cardBorder }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{badge.icon}</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-2xs"
                style={{
                  backgroundColor: categoryMood.badgeBg,
                  color: categoryMood.badgeText,
                  borderColor: categoryMood.borderColor,
                }}
              >
                {badge.label}
              </span>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{
                color: theme.colors.textHeading,
                fontFamily: headingFont,
              }}
            >
              {event.name}
            </h3>
            {event.subtitle && (
              <p className="text-sm mt-0.5" style={{ color: theme.colors.textMuted }}>
                {event.subtitle}
              </p>
            )}
          </div>

          {/* Add to Calendar Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 active:scale-95 shadow-sm"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.textHeading,
                borderColor: theme.colors.cardBorder,
              }}
            >
              <CalendarPlus className="w-4 h-4" style={{ color: isDarkBg ? timingColor : theme.colors.primary }} />
              <span>{addedSuccess ? 'Saved!' : 'Add to Calendar'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCalendarMenu ? 'rotate-180' : ''}`} />
            </button>

            {showCalendarMenu && (
              <div 
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-20 animate-in fade-in zoom-in-95 duration-150"
              >
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowCalendarMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>Google Calendar</span>
                </a>
                <button
                  onClick={handleDownloadIcs}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-700 hover:bg-rose-50 hover:text-rose-900 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Apple / Outlook (iCal)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date, Time & Venue Key Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timing Box */}
          <div 
            className="p-4 rounded-xl border flex items-start gap-3.5 transition-colors"
            style={{ 
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.06)' : theme.colors.background,
              borderColor: theme.colors.cardBorder 
            }}
          >
            <div 
              className="p-2.5 rounded-lg text-white shadow-sm shrink-0"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: labelMutedColor }}>
                Date & Timing
              </span>
              <p className="font-bold text-sm sm:text-base mt-0.5" style={{ color: headingColor, fontFamily: theme.fontFamily.heading }}>
                {event.formattedDate}
              </p>
              <p className="text-xs sm:text-sm font-semibold mt-0.5 tracking-wide" style={{ color: timingColor }}>
                {event.time} {event.endTime ? `– ${event.endTime}` : ''}
              </p>
            </div>
          </div>

          {/* Venue Box */}
          <div 
            className="p-4 rounded-xl border flex items-start gap-3.5 transition-colors"
            style={{ 
              backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.06)' : theme.colors.background,
              borderColor: theme.colors.cardBorder 
            }}
          >
            <div 
              className="p-2.5 rounded-lg text-white shadow-sm shrink-0"
              style={{ backgroundColor: theme.colors.goldOrMetallic }}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: labelMutedColor }}>
                Location & Venue
              </span>
              <p className="font-bold text-sm sm:text-base truncate mt-0.5" style={{ color: headingColor, fontFamily: theme.fontFamily.heading }}>
                {event.venue.name}
              </p>
              <p className="text-xs mt-0.5 leading-relaxed font-medium" style={{ color: addressColor }}>
                {event.venue.address}, {event.venue.cityStateZip}
              </p>
            </div>
          </div>
        </div>

        {/* Description / Special Instructions */}
        {event.description && (
          <p className="text-sm leading-relaxed" style={{ color: isDarkBg ? addressColor : theme.colors.textBody }}>
            {event.description}
          </p>
        )}

        {/* Schedule Highlights */}
        {event.scheduleHighlights && event.scheduleHighlights.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: labelMutedColor }}>
              Program Schedule
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.scheduleHighlights.map((highlight, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs"
                  style={{ backgroundColor: theme.colors.badgeBg, color: theme.colors.textHeading }}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: isDarkBg ? timingColor : theme.colors.primary }} />
                  <span className="font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info: Dress Code, Parking & Maps link */}
        <div className="pt-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4" style={{ borderColor: theme.colors.cardBorder }}>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {event.dressCode && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 245, 244, 0.9)',
                  borderColor: isDarkBg ? theme.colors.cardBorder : '#e7e5e4',
                  color: isDarkBg ? addressColor : '#44403c',
                }}
              >
                <Shirt className="w-3.5 h-3.5" style={{ color: isDarkBg ? timingColor : '#78716c' }} />
                <span className="font-medium">Attire: {event.dressCode}</span>
              </div>
            )}
            {event.venue.parkingInfo && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
                style={{
                  backgroundColor: isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 245, 244, 0.9)',
                  borderColor: isDarkBg ? theme.colors.cardBorder : '#e7e5e4',
                  color: isDarkBg ? addressColor : '#44403c',
                }}
              >
                <Car className="w-3.5 h-3.5" style={{ color: isDarkBg ? timingColor : '#78716c' }} />
                <span className="font-medium">Parking on-site</span>
              </div>
            )}
          </div>

          {/* Maps Navigation Button */}
          {event.venue.mapsUrl && (
            <a
              href={event.venue.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-95 shadow-sm"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
