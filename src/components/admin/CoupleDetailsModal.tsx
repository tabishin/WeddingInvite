import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  X, 
  Sparkles, 
  Save, 
  Calendar, 
  Hash, 
  Mail, 
  Phone, 
  FileText, 
  Check, 
  Wand2,
  Users,
  Loader2,
  Gift,
  Music,
  ExternalLink
} from 'lucide-react';
import { WeddingProject, WeddingTheme } from '../../types/wedding';

interface CoupleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WeddingProject;
  theme: WeddingTheme;
  onProjectUpdated: (project: WeddingProject) => void | Promise<void>;
}

export const CoupleDetailsModal: React.FC<CoupleDetailsModalProps> = ({
  isOpen,
  onClose,
  project,
  theme,
  onProjectUpdated,
}) => {
  const [partner1, setPartner1] = useState(project.couple.partner1 || '');
  const [partner2, setPartner2] = useState(project.couple.partner2 || '');
  const [fullName1, setFullName1] = useState(project.couple.fullName1 || '');
  const [fullName2, setFullName2] = useState(project.couple.fullName2 || '');
  const [formattedTitle, setFormattedTitle] = useState(project.couple.formattedTitle || '');
  const [announcementTitle, setAnnouncementTitle] = useState(project.announcementTitle || '');
  const [tagline, setTagline] = useState(project.tagline || '');
  const [loveStory, setLoveStory] = useState(project.loveStory || '');
  const [weddingDate, setWeddingDate] = useState(
    project.weddingDate ? project.weddingDate.split('T')[0] : '2026-10-24'
  );
  const [weddingDateFormatted, setWeddingDateFormatted] = useState(project.weddingDateFormatted || '');
  const [rsvpDeadlineFormatted, setRsvpDeadlineFormatted] = useState(project.rsvpDeadlineFormatted || '');
  const [showRsvp, setShowRsvp] = useState(project.showRsvp !== false);
  const [maxGuestsPerRsvp, setMaxGuestsPerRsvp] = useState(project.maxGuestsPerRsvp || 3);
  const [weddingHashtag, setWeddingHashtag] = useState(project.contact?.weddingHashtag || '');
  const [email, setEmail] = useState(project.contact?.email || '');
  const [phone, setPhone] = useState(project.contact?.phone || '');
  const [giftRegistryUrl, setGiftRegistryUrl] = useState(project.giftRegistryUrl || '');
  const [audioEnabled, setAudioEnabled] = useState(project.audioTrack?.enabled ?? true);
  const [audioTitle, setAudioTitle] = useState(project.audioTrack?.title || 'Canon in D - Acoustic Romance');
  const [audioArtist, setAudioArtist] = useState(project.audioTrack?.artist || 'Johann Pachelbel (Acoustic Arr.)');
  const [audioUrl, setAudioUrl] = useState(project.audioTrack?.url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form inputs whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setPartner1(project.couple.partner1 || '');
      setPartner2(project.couple.partner2 || '');
      setFullName1(project.couple.fullName1 || '');
      setFullName2(project.couple.fullName2 || '');
      setFormattedTitle(project.couple.formattedTitle || '');
      setAnnouncementTitle(project.announcementTitle || '');
      setTagline(project.tagline || '');
      setLoveStory(project.loveStory || '');
      setWeddingDate(project.weddingDate ? project.weddingDate.split('T')[0] : '2026-10-24');
      setWeddingDateFormatted(project.weddingDateFormatted || '');
      setRsvpDeadlineFormatted(project.rsvpDeadlineFormatted || '');
      setShowRsvp(project.showRsvp !== false);
      setMaxGuestsPerRsvp(project.maxGuestsPerRsvp || 3);
      setWeddingHashtag(project.contact?.weddingHashtag || '');
      setEmail(project.contact?.email || '');
      setPhone(project.contact?.phone || '');
      setGiftRegistryUrl(project.giftRegistryUrl || '');
      setAudioEnabled(project.audioTrack?.enabled ?? true);
      setAudioTitle(project.audioTrack?.title || 'Canon in D - Acoustic Romance');
      setAudioArtist(project.audioTrack?.artist || 'Johann Pachelbel (Acoustic Arr.)');
      setAudioUrl(project.audioTrack?.url || '');
      setSavedSuccess(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAutoFormatTitle = () => {
    const p1 = partner1.trim() || 'Bride';
    const p2 = partner2.trim() || 'Groom';
    setFormattedTitle(`${p1} & ${p2}`);
  };

  // Automatically keep formatted title in sync when editing partner names
  const handlePartner1Change = (newP1: string) => {
    setPartner1(newP1);
    const oldP1 = partner1.trim();
    const currentP2 = partner2.trim() || 'Groom';
    if (
      !formattedTitle ||
      formattedTitle === `${oldP1} & ${currentP2}` ||
      formattedTitle === project.couple.formattedTitle ||
      formattedTitle === `${project.couple.partner1} & ${project.couple.partner2}`
    ) {
      setFormattedTitle(`${newP1.trim() || 'Bride'} & ${currentP2}`);
    }
  };

  const handlePartner2Change = (newP2: string) => {
    setPartner2(newP2);
    const currentP1 = partner1.trim() || 'Bride';
    const oldP2 = partner2.trim();
    if (
      !formattedTitle ||
      formattedTitle === `${currentP1} & ${oldP2}` ||
      formattedTitle === project.couple.formattedTitle ||
      formattedTitle === `${project.couple.partner1} & ${project.couple.partner2}`
    ) {
      setFormattedTitle(`${currentP1} & ${newP2.trim() || 'Groom'}`);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWeddingDate(val);
    if (val) {
      try {
        const d = new Date(val + 'T12:00:00');
        const formatted = d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        setWeddingDateFormatted(formatted);

        // Calculate default RSVP date (~3 weeks before)
        const rsvpDate = new Date(d);
        rsvpDate.setDate(rsvpDate.getDate() - 21);
        const rsvpFormatted = rsvpDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        setRsvpDeadlineFormatted(rsvpFormatted);
      } catch {
        // keep existing
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const p1 = partner1.trim();
    const p2 = partner2.trim();
    let titleToUse = formattedTitle.trim();
    // If user changed partner names but formattedTitle still matches the old title, auto-sync
    if (!titleToUse || titleToUse === project.couple.formattedTitle) {
      if (p1 !== project.couple.partner1 || p2 !== project.couple.partner2) {
        titleToUse = `${p1 || 'Bride'} & ${p2 || 'Groom'}`;
      }
    }
    if (!titleToUse) {
      titleToUse = `${p1 || 'Bride'} & ${p2 || 'Groom'}`;
    }

    console.log('[CoupleDetailsModal] Submitting update to server:', {
      partner1: p1,
      partner2: p2,
      formattedTitle: titleToUse,
    });

    const updatedProject: WeddingProject = {
      ...project,
      couple: {
        partner1: p1,
        partner2: p2,
        fullName1: fullName1.trim() || p1,
        fullName2: fullName2.trim() || p2,
        formattedTitle: titleToUse,
      },
      announcementTitle: announcementTitle.trim(),
      tagline: tagline.trim(),
      loveStory: loveStory.trim(),
      weddingDate: weddingDate ? `${weddingDate}T15:30:00` : project.weddingDate,
      weddingDateFormatted: weddingDateFormatted.trim() || project.weddingDateFormatted,
      rsvpDeadlineFormatted: rsvpDeadlineFormatted.trim() || project.rsvpDeadlineFormatted,
      showRsvp: showRsvp,
      maxGuestsPerRsvp: Number(maxGuestsPerRsvp) || 3,
      invitationLinks: (project.invitationLinks || []).map((l) => ({
        ...l,
        maxGuests: Number(maxGuestsPerRsvp) || 3,
      })),
      events: project.events.map((evt, idx) => {
        if (idx === 0 && weddingDate && (!evt.date || evt.date === '2026-10-24')) {
          return { ...evt, date: weddingDate };
        }
        return evt;
      }),
      contact: {
        email: email.trim(),
        phone: phone.trim(),
        weddingHashtag: weddingHashtag.trim(),
      },
      showGiftRegistry: project.showGiftRegistry ?? true,
      showWishes: project.showWishes ?? true,
      giftRegistryUrl: giftRegistryUrl.trim() || undefined,
      audioTrack: {
        enabled: audioEnabled,
        title: audioTitle.trim() || 'Canon in D - Acoustic Romance',
        artist: audioArtist.trim() || 'Johann Pachelbel (Acoustic Arr.)',
        url: audioUrl.trim(),
      },
    };

    setIsSaving(true);
    await onProjectUpdated(updatedProject);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="couple-details-modal"
        className="bg-white rounded-3xl border border-stone-200 w-full max-w-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-6 border-b border-stone-200 flex items-center justify-between"
          style={{ background: theme.colors.backgroundGradient }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: theme.fontFamily.heading }}>
                Edit Bride & Groom Details
              </h3>
              <p className="text-xs text-stone-600">
                Update couple names, invitation titles, story, and wedding dates across the entire portal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Couple Names */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Bride & Groom Names
              </span>
              <button
                type="button"
                onClick={handleAutoFormatTitle}
                className="text-xs font-semibold text-stone-600 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-Format Title</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Partner 1 / Bride Name *
                </label>
                <input
                  type="text"
                  required
                  value={partner1}
                  onChange={(e) => handlePartner1Change(e.target.value)}
                  placeholder="e.g. Sophia Martinez or فاطمہ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Partner 2 / Groom Name *
                </label>
                <input
                  type="text"
                  required
                  value={partner2}
                  onChange={(e) => handlePartner2Change(e.target.value)}
                  placeholder="e.g. Alexander Harrison or زین"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Bride Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName1}
                  onChange={(e) => setFullName1(e.target.value)}
                  placeholder="e.g. Sophia Isabella Martinez"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Groom Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName2}
                  onChange={(e) => setFullName2(e.target.value)}
                  placeholder="e.g. Alexander James Harrison"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>Display Headline / Formatted Title *</span>
                <span className="text-[11px] font-normal text-stone-400">Appears prominently on invitation cards</span>
              </label>
              <input
                type="text"
                required
                value={formattedTitle}
                onChange={(e) => setFormattedTitle(e.target.value)}
                placeholder="e.g. Sophia & Alexander or فاطمہ و زین or प्रिया संग राहुल"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-base font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                style={{ fontFamily: theme.fontFamily.heading }}
              />
            </div>
          </div>

          {/* Section 2: Announcement & Tagline */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Announcement & Nuptial Message
            </span>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Announcement Header
              </label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Together with their families / Save the Date"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Invitation Tagline / Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Request the pleasure of your company on their wedding day"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                <span>Couple Love Story / Welcome Note</span>
                <span className="text-[11px] font-normal text-stone-400">Displayed in the guest invitation view</span>
              </label>
              <textarea
                rows={3}
                value={loveStory}
                onChange={(e) => setLoveStory(e.target.value)}
                placeholder="Share a short sweet message or story for your wedding guests..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 3: Wedding Dates & RSVP */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Dates & Timeline
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Wedding Date Picker
                </label>
                <input
                  type="date"
                  value={weddingDate}
                  onChange={handleDateChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Wedding Date Display Text
                </label>
                <input
                  type="text"
                  value={weddingDateFormatted}
                  onChange={(e) => setWeddingDateFormatted(e.target.value)}
                  placeholder="e.g. Saturday, October 24, 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                RSVP Deadline Text
              </label>
              <input
                type="text"
                value={rsvpDeadlineFormatted}
                onChange={(e) => setRsvpDeadlineFormatted(e.target.value)}
                placeholder="e.g. September 20, 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            {/* RSVP Live Visibility & Guest Limits */}
            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800">Show RSVP on Invitation</h4>
                  <p className="text-[11px] text-stone-500">
                    When disabled, the hero RSVP button and "Kindly Respond" section are hidden.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showRsvp}
                  onClick={() => setShowRsvp(!showRsvp)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showRsvp ? 'bg-rose-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showRsvp ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {showRsvp && (
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                  <label className="text-xs font-semibold text-stone-700">
                    Max Allowed Guests per RSVP
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={maxGuestsPerRsvp}
                    onChange={(e) => setMaxGuestsPerRsvp(Math.max(1, Math.min(15, parseInt(e.target.value) || 1)))}
                    className="w-20 px-2.5 py-1 text-xs text-center font-bold border border-stone-300 rounded-lg bg-white text-stone-800"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Contact & Social */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              Hashtag & Contact Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Wedding Hashtag
                </label>
                <input
                  type="text"
                  value={weddingHashtag}
                  onChange={(e) => setWeddingHashtag(e.target.value)}
                  placeholder="#SophiaAndAlex2026"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@wedding.com"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Nuptial Registry & Wishes */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              Gift Registry & Digital Wishing Well
            </span>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Registry URL (Zola, Amazon, Honeyfund, Target, or Custom)
              </label>
              <input
                type="url"
                value={giftRegistryUrl}
                onChange={(e) => setGiftRegistryUrl(e.target.value)}
                placeholder="https://www.zola.com/registry/your-names"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Displays the curated registry card on the guest invitation view alongside digital blessings.
              </p>
            </div>
          </div>

          {/* Section 6: Background Ceremonial Music */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                Celebration Background Melody
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-400"
                />
                <span>Enable Music Player</span>
              </label>
            </div>

            {audioEnabled && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Track Title
                    </label>
                    <input
                      type="text"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Canon in D - Acoustic Romance"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Artist / Ensemble
                    </label>
                    <input
                      type="text"
                      value={audioArtist}
                      onChange={(e) => setAudioArtist(e.target.value)}
                      placeholder="Johann Pachelbel (Acoustic Arr.)"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    YouTube URL or Audio Stream / MP3 URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://.../song.mp3"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    📺 Supports any YouTube video URL (plays celebration audio in background), direct MP3/WAV links, or leave empty for romantic harp synthesizer.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savedSuccess || isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Couple & Wedding Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
