import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Send
} from 'lucide-react';
import { WeddingProject, WeddingTheme, InvitationLink, WeddingEvent } from '../../types/wedding';
import { ThemeParticles } from './ThemeParticles';
import { CountdownTimer } from './CountdownTimer';
import { EventCard } from './EventCard';
import { RsvpModal } from './RsvpModal';
import { AudioPlayer } from './AudioPlayer';
import { GiftRegistrySection } from './GiftRegistrySection';
import { PhotoGallerySection } from './PhotoGallerySection';
import { RoyalDoorOpening } from './RoyalDoorOpening';
import { ScratchToRevealDate } from './ScratchToRevealDate';
import { recordLinkView, normalizeLinkCode } from '../../services/storage';
import { loadGoogleFont, loadCustomFontStylesheet } from '../../data/fontOptions';
import { isColorDark } from '../../services/colorUtils';
import { getEffectiveShareMetadata } from '../../services/shareMetadata';
import { 
  isThemeOrBackgroundDark, 
  getThemeTimingColor, 
  getThemeAddressColor, 
  getThemeHeadingColor, 
  getThemeLabelColor 
} from '../../services/colorUtils';

interface GuestInvitationViewProps {
  project: WeddingProject;
  theme: WeddingTheme;
  activeLinkCode: string;
  onNavigateToAdmin: () => void;
  onSwitchLink: (code: string) => void;
  onProjectUpdated: (project: WeddingProject) => void;
  isHostPreviewMode?: boolean;
}

export const GuestInvitationView: React.FC<GuestInvitationViewProps> = ({
  project,
  theme,
  activeLinkCode,
  onNavigateToAdmin,
  onSwitchLink,
  onProjectUpdated,
  isHostPreviewMode = false,
}) => {
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);

  // Royal 3D Door Entrance Feature
  const hasDoorFeature = !!theme.hasDoorOpening;
  const isDoorAllowed = project.enableDoorOpening !== false;
  const [showDoorEntrance, setShowDoorEntrance] = useState(hasDoorFeature && isDoorAllowed);

  useEffect(() => {
    if (theme.hasDoorOpening && project.enableDoorOpening !== false) {
      setShowDoorEntrance(true);
    } else {
      setShowDoorEntrance(false);
    }
  }, [theme.id, project.enableDoorOpening]);

  // Normalized link lookup
  const normalizedCode = normalizeLinkCode(activeLinkCode);
  const currentLink: InvitationLink = 
    project.invitationLinks.find((l) => l.code === activeLinkCode || normalizeLinkCode(l.code) === normalizedCode) ||
    project.invitationLinks[0];

  // Dynamic Typography Configuration
  const headingFont = project.typography?.headingFont || theme.fontFamily.heading;
  const scriptFont = project.typography?.scriptFont || theme.fontFamily.script;
  const bodyFont = project.typography?.bodyFont || theme.fontFamily.body;
  const customFontUrl = project.typography?.customFontUrl;
  const auspiciousInvocation = project.typography?.auspiciousInvocation;
  const isRTL = !!project.typography?.isRTL;

  // Dynamically load custom and google fonts on the guest view
  useEffect(() => {
    loadGoogleFont(headingFont);
    loadGoogleFont(scriptFont);
    loadGoogleFont(bodyFont);
    if (customFontUrl) {
      loadCustomFontStylesheet(customFontUrl);
    }
  }, [headingFont, scriptFont, bodyFont, customFontUrl]);

  // Filter events strictly for this invitation link
  const visibleEvents: WeddingEvent[] = project.events.filter((evt) =>
    currentLink.eventIds.includes(evt.id)
  ).sort((a, b) => a.order - b.order);

  // Helper to parse event date & time into ISO string for the countdown timer
  const parseEventDateTime = (event?: WeddingEvent): string => {
    if (!event || !event.date) return project.weddingDate;
    const dateStr = event.date;
    const timeStr = event.time || '12:00 PM';
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = String(parseInt(match[2], 10)).padStart(2, '0');
      const meridian = match[3] ? match[3].toUpperCase() : null;
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      const hourStr = String(hours).padStart(2, '0');
      return `${dateStr}T${hourStr}:${minutes}:00`;
    }
    return `${dateStr}T12:00:00`;
  };

  // Helper to format clean multi-day date strings when events span multiple days
  const formatMultiDates = (events: WeddingEvent[], defaultFormatted: string): string => {
    const dates = events.map((e) => e.date).filter(Boolean);
    const uniqueDates = Array.from(new Set(dates));
    if (uniqueDates.length <= 1) {
      return events[0]?.formattedDate || defaultFormatted;
    }
    const parsed = uniqueDates
      .map((d) => {
        const p = new Date(`${d}T12:00:00`);
        return isNaN(p.getTime()) ? null : p;
      })
      .filter((p): p is Date => p !== null);

    if (parsed.length === 2) {
      const d1 = parsed[0];
      const d2 = parsed[1];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
        return `${monthNames[d1.getMonth()]} ${d1.getDate()} & ${d2.getDate()}, ${d1.getFullYear()}`;
      }
      if (d1.getFullYear() === d2.getFullYear()) {
        return `${monthNames[d1.getMonth()]} ${d1.getDate()} & ${monthNames[d2.getMonth()]} ${d2.getDate()}, ${d1.getFullYear()}`;
      }
    }
    const uniqueFormatted = Array.from(new Set(events.map((e) => e.formattedDate).filter(Boolean)));
    return uniqueFormatted.join(' & ') || defaultFormatted;
  };

  // Determine dynamic link-aware Hero Date, Subtitle, and Countdown
  const singleEvent = visibleEvents.length === 1 ? visibleEvents[0] : undefined;

  let heroDisplayDate = project.weddingDateFormatted;
  let heroSubtitle = 'Sacred Matrimonial Celebration';
  let heroCountdownTarget = project.weddingDate;
  let heroCountdownLabel: string | undefined = undefined;

  if (singleEvent) {
    // Single-event link (e.g. Reception Only or Wedding Ceremony Only)
    heroDisplayDate = singleEvent.formattedDate || project.weddingDateFormatted;
    heroSubtitle = singleEvent.name;
    heroCountdownTarget = parseEventDateTime(singleEvent);
    heroCountdownLabel = `Countdown to ${singleEvent.name}`;
  } else if (visibleEvents.length > 1) {
    // Multi-event link (e.g. Wedding + Reception or All Events)
    heroDisplayDate = formatMultiDates(visibleEvents, project.weddingDateFormatted);
    heroSubtitle = 'Sacred Matrimonial Celebrations';

    // Count down to the first upcoming event (or first event in the list)
    const now = Date.now();
    const upcomingEvents = visibleEvents
      .map((e) => ({ event: e, timestamp: +new Date(parseEventDateTime(e)) }))
      .sort((a, b) => a.timestamp - b.timestamp);
    const nextEventObj = upcomingEvents.find((e) => e.timestamp > now) || upcomingEvents[0];
    const nextEvent = nextEventObj?.event || visibleEvents[0];

    heroCountdownTarget = parseEventDateTime(nextEvent);
    heroCountdownLabel = nextEvent ? `Countdown to ${nextEvent.name}` : undefined;
  }

  // Synchronize document title and OpenGraph metadata dynamically
  useEffect(() => {
    const linkMeta = getEffectiveShareMetadata(currentLink, project);
    const pageTitle = linkMeta.title;
    document.title = pageTitle;
    
    const desc = linkMeta.description || `Wedding celebration of ${project.couple.formattedTitle}`;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && linkMeta?.imageUrl) {
      ogImg.setAttribute('content', linkMeta.imageUrl);
    }
  }, [currentLink, project]);

  // Record link view once on mount and log guest session
  useEffect(() => {
    if (activeLinkCode) {
      console.log(`[GUEST VIEW] 💌 Invitation URL opened with link code: "${activeLinkCode}"`);
      console.log(`[GUEST VIEW] 💍 Active Couple: "${project.couple?.formattedTitle}" (v${project.version || '1'})`);
      recordLinkView(activeLinkCode);
    }
  }, [activeLinkCode]);

  useEffect(() => {
    console.log(`[GUEST VIEW] 🔄 Invitation view updated with couple: "${project.couple?.formattedTitle}" | Version: ${project.version || '1'} | UpdatedAt: ${project.updatedAt}`);
  }, [project.couple?.formattedTitle, project.version, project.updatedAt]);

  // Top Subtitle/Invocation Header text (ensuring no duplicate repeat)
  const headerSubtitle = auspiciousInvocation || project.announcementTitle || 'Together with their families';

  // Contrast adjustments for dark themes & dark backgrounds
  const isDarkBg = isThemeOrBackgroundDark(theme);
  const timingColor = getThemeTimingColor(theme);
  const addressColor = getThemeAddressColor(theme);
  const headingColor = getThemeHeadingColor(theme);
  const labelMutedColor = getThemeLabelColor(theme);

  // RSVP visibility setting (defaults to true if undefined)
  const showRsvp = project.showRsvp !== false;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden transition-colors duration-700 pb-24"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: theme.colors.backgroundGradient,
        color: isDarkBg ? addressColor : theme.colors.textBody,
        fontFamily: bodyFont,
      }}
    >
      {/* Floating Theme Particles */}
      <ThemeParticles theme={theme} />

      {/* Main Container - Clean, Uncluttered Invitation */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 relative z-10 space-y-12">
        {/* Envelope Presentation Card / Hero Section */}
        <section
          className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center transition-all duration-500"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            borderWidth: theme.decorations.frameStyle === 'gold-double' ? '3px' : '1px',
            boxShadow: theme.decorations.cardShadow,
          }}
        >
          {/* Top Decorative Motif */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-[1px] w-12 sm:w-20" style={{ backgroundColor: theme.colors.goldOrMetallic }} />
            <span className="text-2xl sm:text-3xl select-none" style={{ color: theme.colors.goldOrMetallic }}>
              {theme.decorations.sealEmoji}
            </span>
            <div className="h-[1px] w-12 sm:w-20" style={{ backgroundColor: theme.colors.goldOrMetallic }} />
          </div>

          {/* Authentic Lake Pichola Archway Artwork for Rajputana Jharokha theme (video reference 0:02) */}
          {(theme.id === 'rajput-haveli-doors' || theme.id.includes('haveli')) && (
            <div className="relative w-full max-w-md mx-auto h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 shadow-xl border-2 border-amber-400/40">
              <img
                src="/assets/themes/jharokha/hero.webp"
                alt="Couple overlooking Lake Pichola Udaipur"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 inset-x-0 text-center">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-xs text-amber-200 border border-amber-300/40">
                  Udaipur • Lake Pichola
                </span>
              </div>
            </div>
          )}

          {/* Single Auspicious Invocation / Announcement Subtitle */}
          {headerSubtitle && (
            <div className="mb-4">
              <p
                className="text-lg sm:text-2xl font-bold tracking-wide leading-relaxed"
                style={{
                  color: theme.colors.goldOrMetallic,
                  fontFamily: headingFont,
                }}
              >
                {headerSubtitle}
              </p>
            </div>
          )}

          {/* Couple Formatted Title */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight my-4 leading-tight"
            style={{
              color: headingColor,
              fontFamily: headingFont,
            }}
          >
            {project.couple.formattedTitle}
          </h1>

          {/* Tagline */}
          <p
            className="text-sm sm:text-lg max-w-xl mx-auto leading-relaxed my-4 italic"
            style={{ color: isDarkBg ? addressColor : theme.colors.textBody, fontFamily: scriptFont }}
          >
            {project.tagline}
          </p>

          {/* Interactive Scratch-to-Reveal Date Card or Classic Date Display */}
          {theme.hasScratchToReveal || project.enableScratchToReveal ? (
            <div className="my-8 max-w-md mx-auto">
              <ScratchToRevealDate
                theme={theme}
                project={project}
                customDateFormatted={heroDisplayDate}
                activeEvent={singleEvent}
              />
            </div>
          ) : (
            /* Big Date Display */
            <div className="my-8 py-4 border-y border-dashed max-w-md mx-auto" style={{ borderColor: theme.colors.cardBorder }}>
              <p
                className="text-xl sm:text-2xl font-bold tracking-wide"
                style={{
                  color: headingColor,
                  fontFamily: headingFont,
                }}
              >
                {heroDisplayDate}
              </p>
              <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: isDarkBg ? labelMutedColor : theme.colors.textMuted, fontFamily: bodyFont }}>
                {heroSubtitle}
              </p>
            </div>
          )}

          {/* Countdown Timer */}
          <CountdownTimer targetDate={heroCountdownTarget} theme={theme} label={heroCountdownLabel} />

          {/* Quick RSVP CTA in Hero */}
          {showRsvp && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setIsRsvpOpen(true)}
                className="px-8 py-3.5 rounded-full font-bold text-sm text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 10px 25px -5px ${theme.colors.glowEffect || 'rgba(0,0,0,0.2)'}`
                }}
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>RSVP to Invitation</span>
              </button>
            </div>
          )}
        </section>

        {/* Love Story / Couple Note */}
        {project.loveStory && (
          <section
            className="rounded-3xl p-8 sm:p-10 text-center max-w-2xl mx-auto border"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <span className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: theme.colors.goldOrMetallic }}>
              Our Story
            </span>
            <p
              className="text-base sm:text-lg leading-relaxed italic"
              style={{ color: isDarkBg ? addressColor : theme.colors.textBody, fontFamily: bodyFont }}
            >
              "{project.loveStory}"
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span 
                className="text-sm font-semibold" 
                style={{ 
                  color: isDarkBg ? timingColor : theme.colors.primary 
                }}
              >
                {project.contact.weddingHashtag}
              </span>
            </div>
          </section>
        )}

        {/* Schedule / Filtered Events Section */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span
              className="text-xs font-bold uppercase tracking-widest block mb-1"
              style={{ color: theme.colors.goldOrMetallic }}
            >
              Event Itinerary & Details
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{
                color: headingColor,
                fontFamily: headingFont,
              }}
            >
              Wedding Celebration Schedule
            </h2>
            <p className="text-xs sm:text-sm mt-2" style={{ color: isDarkBg ? labelMutedColor : theme.colors.textMuted, fontFamily: bodyFont }}>
              Event venues, dress codes, timings, and interactive location directions
            </p>
          </div>

          {/* Events List */}
          <div className="space-y-6">
            {visibleEvents.length > 0 ? (
              visibleEvents.map((evt, idx) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  theme={theme}
                  coupleNames={project.couple.formattedTitle}
                  index={idx}
                  customTypography={{ headingFont, scriptFont, bodyFont }}
                />
              ))
            ) : (
              <div 
                className="p-8 text-center rounded-2xl border"
                style={{ 
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  color: isDarkBg ? addressColor : '#78716c'
                }}
              >
                <p>No events currently assigned to this link.</p>
              </div>
            )}
          </div>
        </section>

        {/* Gift Registry & Warm Blessings Section */}
        <GiftRegistrySection
          project={project}
          theme={theme}
          headingFont={headingFont}
          bodyFont={bodyFont}
          onProjectUpdated={onProjectUpdated}
        />

        {/* Wedding Photo Gallery & Guest Albums */}
        {project.showPhotosSection !== false && (
          <PhotoGallerySection
            project={project}
            theme={theme}
            headingFont={headingFont}
            bodyFont={bodyFont}
            onProjectUpdated={onProjectUpdated}
          />
        )}

        {/* RSVP Dedicated Section ("Kindly Respond" block) */}
        {showRsvp && (
          <section
            className="rounded-3xl p-8 sm:p-12 text-center border overflow-hidden relative"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
              boxShadow: theme.decorations.cardShadow,
            }}
          >
            <div className="max-w-lg mx-auto space-y-4">
              <span
                className="text-xs font-bold uppercase tracking-widest block"
                style={{ color: theme.colors.goldOrMetallic }}
              >
                Kindly Respond
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold"
                style={{
                  color: headingColor,
                  fontFamily: theme.fontFamily.heading,
                }}
              >
                Will You Join Us?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: isDarkBg ? addressColor : theme.colors.textBody }}>
                Please let us know if you can make it by{' '}
                <strong className="font-bold" style={{ color: isDarkBg ? timingColor : theme.colors.primary }}>
                  {project.rsvpDeadlineFormatted}
                </strong>{' '}
                so we can reserve your place.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsRsvpOpen(true)}
                  className="px-10 py-4 rounded-full font-bold text-sm sm:text-base text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2.5"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Send className="w-5 h-5" />
                  <span>Respond to Invitation</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-6 pb-6">
          {/* Discreet Host Access Link */}
          <div>
            <button
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all opacity-60 hover:opacity-100"
              title="Protected Host & Wedding Management Dashboard"
            >
              <span>🔒</span>
              <span>Host Login / Dashboard</span>
            </button>
          </div>
        </footer>
      </main>

      {/* RSVP Modal */}
      {showRsvp && (
        <RsvpModal
          isOpen={isRsvpOpen}
          onClose={() => setIsRsvpOpen(false)}
          project={project}
          link={currentLink}
          events={visibleEvents}
          theme={theme}
          targetDateFormatted={heroDisplayDate}
          onRsvpSubmitted={(updated) => {
            onProjectUpdated(updated);
          }}
        />
      )}

      {/* Floating Ambient Wedding Audio Player */}
      <AudioPlayer audioTrack={project.audioTrack} theme={theme} />

      {/* Floating Replay Door Opening Button */}
      {hasDoorFeature && !showDoorEntrance && (
        <button
          onClick={() => setShowDoorEntrance(true)}
          className="fixed bottom-6 left-6 z-40 px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 border border-amber-300/50 bg-stone-900/90 text-amber-300 hover:bg-stone-900 cursor-pointer"
          title="Re-open Royal 3D Entrance Doors"
        >
          <span className="text-base">🚪</span>
          <span className="font-serif">Re-open Royal Doors</span>
        </button>
      )}

      {/* 3D Royal Door Opening Entrance Overlay */}
      {showDoorEntrance && (
        <RoyalDoorOpening
          theme={theme}
          coupleTitle={project.couple.formattedTitle}
          partner1={project.couple.partner1}
          partner2={project.couple.partner2}
          weddingDateFormatted={heroDisplayDate}
          destinationCity="Udaipur"
          onOpenComplete={() => setShowDoorEntrance(false)}
        />
      )}
    </div>
  );
};
