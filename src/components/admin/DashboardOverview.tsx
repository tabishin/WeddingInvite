import React, { useState } from 'react';
import { 
  Heart, 
  Calendar, 
  Users, 
  Eye, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  ArrowRight, 
  Palette, 
  MapPin, 
  Clock, 
  Share2, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  PartyPopper,
  Edit3,
  UserCheck,
  Gift,
  MessageSquareHeart,
  Music,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Camera
} from 'lucide-react';
import { WeddingProject, WeddingTheme, InvitationLink } from '../../types/wedding';
import { QRCodeModal } from '../common/QRCodeModal';
import { CoupleDetailsModal } from './CoupleDetailsModal';
import { SocialSharePreviewStudio } from './SocialSharePreviewStudio';

interface DashboardOverviewProps {
  project: WeddingProject;
  theme: WeddingTheme;
  onNavigateTab: (tab: 'overview' | 'themes' | 'events' | 'links' | 'rsvps' | 'fonts' | 'photos') => void;
  onOpenGuestView: (linkCode: string) => void;
  onProjectUpdated: (project: WeddingProject) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  project,
  theme,
  onNavigateTab,
  onOpenGuestView,
  onProjectUpdated,
}) => {
  const [selectedShareLink, setSelectedShareLink] = useState<InvitationLink | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);

  // Portal Display & Feature controls state
  const showRsvp = project.showRsvp !== false;
  const maxGuests = project.maxGuestsPerRsvp || 3;
  const showGiftRegistry = project.showGiftRegistry !== false;
  const showWishes = project.showWishes !== false;
  const showPhotosSection = project.showPhotosSection !== false;
  const allowGuestPhotoUploads = project.allowGuestPhotoUploads !== false;
  const audioEnabled = project.audioTrack?.enabled ?? true;

  const [editingRegistry, setEditingRegistry] = useState(false);
  const [registryUrlInput, setRegistryUrlInput] = useState(project.giftRegistryUrl || '');
  const [editingMusic, setEditingMusic] = useState(false);
  const [musicUrlInput, setMusicUrlInput] = useState(project.audioTrack?.url || '');

  const handleToggleRsvp = (enabled: boolean) => {
    onProjectUpdated({
      ...project,
      showRsvp: enabled,
    });
  };

  const handleUpdateMaxGuests = (count: number) => {
    const safeCount = Math.max(1, Math.min(15, count));
    const updatedLinks = (project.invitationLinks || []).map((l) => ({
      ...l,
      maxGuests: safeCount,
    }));
    onProjectUpdated({
      ...project,
      maxGuestsPerRsvp: safeCount,
      invitationLinks: updatedLinks,
    });
  };

  const handleToggleRegistry = (enabled: boolean) => {
    onProjectUpdated({
      ...project,
      showGiftRegistry: enabled,
    });
  };

  const handleToggleWishes = (enabled: boolean) => {
    onProjectUpdated({
      ...project,
      showWishes: enabled,
    });
  };

  const handleTogglePhotos = (enabled: boolean) => {
    onProjectUpdated({
      ...project,
      showPhotosSection: enabled,
    });
  };

  const handleToggleGuestUploads = (enabled: boolean) => {
    onProjectUpdated({
      ...project,
      allowGuestPhotoUploads: enabled,
    });
  };

  const handleToggleMusic = (enabled: boolean) => {
    onProjectUpdated({
      ...project,
      audioTrack: {
        ...(project.audioTrack || {
          title: 'Canon in D - Acoustic Romance',
          artist: 'Johann Pachelbel (Acoustic Arr.)',
          url: 'https://www.youtube.com/watch?v=NlprozGcs80',
        }),
        enabled,
      },
    });
  };

  const handleSaveRegistryUrl = () => {
    onProjectUpdated({
      ...project,
      giftRegistryUrl: registryUrlInput.trim() || undefined,
    });
    setEditingRegistry(false);
  };

  const musicPresets = [
    {
      title: 'Canon in D - Acoustic Romance',
      artist: 'Johann Pachelbel (Acoustic Arr.)',
      url: 'https://www.youtube.com/watch?v=NlprozGcs80',
      icon: '🎻',
    },
    {
      title: 'Debussy - Clair de Lune (Romantic Piano)',
      artist: 'Claude Debussy (Piano Masterpiece)',
      url: 'https://www.youtube.com/watch?v=WNcsUNKlAKw',
      icon: '🎹',
    },
    {
      title: 'Romantic Harp & Chimes (Synthesizer)',
      artist: 'Web Audio Ambient Synthesizer',
      url: '',
      icon: '✨',
    },
  ];

  const handleSelectPreset = (preset: { title: string; artist: string; url: string }) => {
    onProjectUpdated({
      ...project,
      audioTrack: {
        enabled: true,
        title: preset.title,
        artist: preset.artist,
        url: preset.url,
      },
    });
  };

  const handleSaveCustomMusic = () => {
    onProjectUpdated({
      ...project,
      audioTrack: {
        ...(project.audioTrack || {
          title: 'Custom Celebration Soundtrack',
          artist: 'Curated Track',
          enabled: true,
        }),
        url: musicUrlInput.trim(),
      },
    });
    setEditingMusic(false);
  };

  const handleCopyLink = (code: string) => {
    const origin = window.location.origin + window.location.pathname;
    const url = `${origin}?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Metrics calculation
  const totalRsvps = project.rsvps?.length || 0;
  const attendingRsvps = project.rsvps?.filter((r) => r.status === 'attending') || [];
  const totalGuestsAttending = attendingRsvps.reduce((acc, curr) => acc + (curr.guestCount || 1), 0);
  const totalViews = project.invitationLinks.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

  // Days left calculation
  const diffDays = Math.max(
    0,
    Math.ceil((+new Date(project.weddingDate) - +new Date()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div 
        className="rounded-3xl p-6 sm:p-8 text-stone-900 border relative overflow-hidden shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{ 
          background: theme.colors.backgroundGradient,
          borderColor: theme.colors.cardBorder 
        }}
      >
        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 text-stone-800 border border-stone-200">
              Wedding Portal Architect
            </span>
            <span className="text-xs font-medium text-stone-600">
              Theme: <strong className="text-stone-900">{theme.name}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900" style={{ fontFamily: theme.fontFamily.heading }}>
            Welcome to {project.couple.formattedTitle}'s Wedding Portal
          </h2>
          <p className="text-sm text-stone-700 leading-relaxed max-w-xl">
            Configure your 3 distinct invitation link types, customize typography with Urdu, Hindi, Arabic, or custom fonts, and manage guest RSVPs.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="relative z-10 shrink-0 flex items-center gap-2.5">
          <button
            onClick={() => setIsCoupleModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold shadow-md border border-stone-200/80 flex items-center justify-center gap-2 transition-all hover:border-rose-300 hover:shadow-lg active:scale-95 group"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <Heart className="w-3.5 h-3.5 fill-rose-600" />
            </div>
            <span>Edit Bride & Groom Details</span>
            <Edit3 className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-600 transition-colors ml-1" />
          </button>
        </div>
      </div>

      {/* Portal Display & Guest Experience Controls */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-stone-900">Portal Features & Display Settings</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Live Controls
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Choose which sections appear on guest invitations and control celebration background music autoplay.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. RSVP Acceptance & Guest Count Toggle */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            showRsvp 
              ? 'bg-rose-50/40 border-rose-200/80 shadow-xs' 
              : 'bg-stone-50/60 border-stone-200 text-stone-400'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    showRsvp ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-500'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">RSVP System</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold block text-stone-500">
                      Attendance CTA & Block
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showRsvp}
                  onClick={() => handleToggleRsvp(!showRsvp)}
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

              <p className="text-xs text-stone-600 leading-relaxed">
                {showRsvp
                  ? 'Guests can RSVP online. Hero button and "Kindly Respond" block are visible.'
                  : 'RSVP is hidden. Hero button and "Kindly Respond" block are completely hidden from guests.'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  showRsvp 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {showRsvp ? '✓ Visible to Guests' : '✕ Hidden'}
                </span>

                <button
                  onClick={() => onNavigateTab('rsvps')}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 underline"
                >
                  {totalRsvps} RSVPs
                </button>
              </div>

              {showRsvp && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-stone-600 font-medium text-[11px]">Max guests:</span>
                  <div className="flex items-center border border-stone-200 bg-white rounded-lg shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateMaxGuests(maxGuests - 1)}
                      disabled={maxGuests <= 1}
                      className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold text-xs disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold text-stone-900">{maxGuests}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateMaxGuests(maxGuests + 1)}
                      disabled={maxGuests >= 15}
                      className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 font-bold text-xs disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Gift Registry Toggle */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            showGiftRegistry 
              ? 'bg-amber-50/40 border-amber-200/80 shadow-xs' 
              : 'bg-stone-50/60 border-stone-200 text-stone-400'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    showGiftRegistry ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-500'
                  }`}>
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Gift Registry</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold block text-stone-500">
                      Nuptial Registry Card
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showGiftRegistry}
                  onClick={() => handleToggleRegistry(!showGiftRegistry)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showGiftRegistry ? 'bg-amber-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showGiftRegistry ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {showGiftRegistry
                  ? 'Guests will see the Nuptial Registry link card and can copy or visit your wedding wishlist.'
                  : 'Gift Registry is hidden from all guest invitation links.'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                showGiftRegistry 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {showGiftRegistry ? '✓ Visible to Guests' : '✕ Hidden'}
              </span>

              {showGiftRegistry && (
                <button
                  onClick={() => setEditingRegistry(!editingRegistry)}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingRegistry ? 'Close URL' : 'Set URL'}</span>
                </button>
              )}
            </div>

            {/* Registry URL Quick Editor */}
            {showGiftRegistry && editingRegistry && (
              <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2 animate-in fade-in">
                <label className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">
                  Registry Wishlist URL
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={registryUrlInput}
                    onChange={(e) => setRegistryUrlInput(e.target.value)}
                    placeholder="https://www.zola.com/registry/..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleSaveRegistryUrl}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Wishes & Blessings Wall Toggle */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            showWishes 
              ? 'bg-rose-50/40 border-rose-200/80 shadow-xs' 
              : 'bg-stone-50/60 border-stone-200 text-stone-400'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    showWishes ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-500'
                  }`}>
                    <MessageSquareHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Wishes & Guestbook</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold block text-stone-500">
                      Warm Blessings Wall
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showWishes}
                  onClick={() => handleToggleWishes(!showWishes)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showWishes ? 'bg-rose-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showWishes ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {showWishes
                  ? 'Guests can submit personalized blessings and advice, and read well-wishes from friends and family.'
                  : 'Wishes and digital guestbook wall are hidden from all guest invitations.'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                showWishes 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {showWishes ? '✓ Visible to Guests' : '✕ Hidden'}
              </span>

              <span className="text-[11px] text-stone-500 font-medium">
                {project.rsvps?.filter(r => r.messageToCouple).length || 0} blessings saved
              </span>
            </div>
          </div>

          {/* 3. Background Music & Autoplay Toggle */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            audioEnabled 
              ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs' 
              : 'bg-stone-50/60 border-stone-200 text-stone-400'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    audioEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-200 text-stone-500'
                  }`}>
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Background Music</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold block text-stone-500">
                      Autoplay Soundtrack
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={audioEnabled}
                  onClick={() => handleToggleMusic(!audioEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    audioEnabled ? 'bg-indigo-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      audioEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {audioEnabled
                  ? 'Celebration soundtrack will automatically autoplay when guests open the invitation.'
                  : 'Music is muted and disabled. Guests will not hear or see the celebration soundtrack.'}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                audioEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {audioEnabled ? '✓ Autoplay Active' : '✕ Disabled'}
              </span>

              {audioEnabled && (
                <button
                  onClick={() => setEditingMusic(!editingMusic)}
                  className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 underline flex items-center gap-1"
                >
                  <Music className="w-3 h-3" />
                  <span>{editingMusic ? 'Close Audio' : 'Choose Music'}</span>
                </button>
              )}
            </div>

            {/* Music Selector & Presets */}
            {audioEnabled && editingMusic && (
              <div className="mt-3 pt-3 border-t border-indigo-200/60 space-y-3 animate-in fade-in">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block mb-1.5">
                    Quick Melody Presets
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {musicPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-xl text-left text-xs border transition-all flex items-center justify-between ${
                          project.audioTrack?.title === preset.title
                            ? 'bg-indigo-100/70 border-indigo-300 font-semibold text-indigo-900'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="truncate">
                          {preset.icon} {preset.title}
                        </span>
                        {project.audioTrack?.title === preset.title && (
                          <Check className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-stone-600 tracking-wider block">
                    YouTube URL or Direct MP3 / Audio Stream
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={musicUrlInput}
                      onChange={(e) => setMusicUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://.../song.mp3"
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSaveCustomMusic}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    Paste any YouTube video link (plays audio-only in background) or direct MP3 / WAV audio link.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 5. Photo Gallery & Guest Albums Toggle */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            showPhotosSection 
              ? 'bg-rose-50/40 border-rose-200/80 shadow-xs' 
              : 'bg-stone-50/60 border-stone-200 text-stone-400'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    showPhotosSection ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-500'
                  }`}>
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Photos & Albums</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold block text-stone-500">
                      Guest Uploads & Gallery
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showPhotosSection}
                  onClick={() => handleTogglePhotos(!showPhotosSection)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showPhotosSection ? 'bg-rose-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showPhotosSection ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {showPhotosSection
                  ? 'Guests can view photo galleries and albums. Hosts can create albums and configure guest upload permissions.'
                  : 'Photo gallery section is hidden from all guest invitations.'}
              </p>

              {/* Sub-toggle: Guest Photo Uploads */}
              {showPhotosSection && (
                <div className="pt-2.5 mt-2 border-t border-rose-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Guest Uploads</span>
                    <span className="text-[10px] text-stone-500 block">
                      {allowGuestPhotoUploads ? 'Guests can upload to albums' : 'Guests can only view photos'}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowGuestPhotoUploads}
                    onClick={() => handleToggleGuestUploads(!allowGuestPhotoUploads)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      allowGuestPhotoUploads ? 'bg-amber-600' : 'bg-stone-300'
                    }`}
                    title="Allow or prevent invited guests from uploading photos"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        allowGuestPhotoUploads ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                showPhotosSection 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {showPhotosSection ? '✓ Visible to Guests' : '✕ Hidden'}
              </span>

              <button
                onClick={() => onNavigateTab('photos')}
                className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 underline flex items-center gap-1"
                title="Manage Albums & Photos"
              >
                <span>{project.photos?.length || 0} Photos ({project.albums?.length || 0} Albums)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Days to Wedding</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">{diffDays}</p>
          <p className="text-xs text-stone-500 mt-0.5">{project.weddingDateFormatted}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Attending Guests</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">{totalGuestsAttending}</p>
          <p className="text-xs text-stone-500 mt-0.5">from {attendingRsvps.length} accepting RSVPs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total RSVPs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">{totalRsvps}</p>
          <p className="text-xs text-stone-500 mt-0.5">{project.rsvps?.filter(r => r.status === 'declined').length || 0} declined</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Shared Photos</span>
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">{project.photos?.length || 0}</p>
          <p className="text-xs text-stone-500 mt-0.5">Across {project.albums?.length || 0} curated albums</p>
        </div>
      </div>

      {/* WHATSAPP & SOCIAL LINK PREVIEW CARD STUDIO */}
      <SocialSharePreviewStudio
        project={project}
        theme={theme}
        onProjectUpdated={onProjectUpdated}
      />

      {/* CORE FEATURE: The 3 Distinct Invitation Links */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-stone-900">
              Core Invitation Links (3 Distinct Types)
            </h3>
            <p className="text-xs text-stone-500">
              Each link independently serves tailored event information based on what each guest is invited to.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('links')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage All Links</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {project.invitationLinks.map((link) => {
            const isCopied = copiedCode === link.code;
            const linkEvents = project.events.filter((e) => link.eventIds.includes(e.id));

            return (
              <div
                key={link.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-xs hover:border-rose-300 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                      {link.type === 'wedding_only' && '1. Wedding Only'}
                      {link.type === 'reception_only' && '2. Reception Only'}
                      {link.type === 'wedding_reception' && '3. Wedding + Reception'}
                      {link.type === 'custom' && 'Custom Guest Pass'}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      {link.viewsCount || 0} views
                    </span>
                  </div>

                  <h4 className="font-bold text-lg text-stone-900 group-hover:text-rose-600 transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                    {link.description}
                  </p>

                  {/* Included Events Checklist */}
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Events Seen by Guest:
                    </span>
                    <div className="space-y-1.5">
                      {linkEvents.map((evt) => (
                        <div key={evt.id} className="flex items-center gap-2 text-xs text-stone-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate">{evt.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Link Action Buttons */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(link.code)}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedShareLink(link)}
                    title="Generate QR Code & WhatsApp Share"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenGuestView(link.code)}
                    title="Preview this exact invitation as guest"
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Grid: Active Theme Spotlight & Events Itinerary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Theme Spotlight */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-stone-900">Current Theme</h3>
              </div>
              <button
                onClick={() => onNavigateTab('themes')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
              >
                <span>Browse 20 Themes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div 
              className="p-5 rounded-2xl border text-stone-900 relative overflow-hidden"
              style={{ 
                background: theme.colors.backgroundGradient,
                borderColor: theme.colors.cardBorder 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/80 text-stone-800 border border-stone-200">
                    {theme.category}
                  </span>
                  <h4 className="text-xl font-bold mt-2" style={{ fontFamily: theme.fontFamily.heading, color: theme.colors.textHeading }}>
                    {theme.name}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 max-w-sm">
                    {theme.tagline}
                  </p>
                </div>
                <span className="text-3xl select-none">{theme.decorations.sealEmoji}</span>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200/60">
                <span className="text-[11px] font-semibold text-stone-500">Palette:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: theme.colors.primary }} title="Primary" />
                  <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: theme.colors.secondary }} title="Secondary" />
                  <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: theme.colors.goldOrMetallic }} title="Metallic / Gold" />
                  <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: theme.colors.badgeBg }} title="Badge Surface" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">20 distinct aesthetics available</span>
            <button
              onClick={() => onNavigateTab('themes')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors"
            >
              Explore All 20 Themes
            </button>
          </div>
        </div>

        {/* Events & Venues Quick Snapshot */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-stone-900">Events & Venues</h3>
              </div>
              <button
                onClick={() => onNavigateTab('events')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
              >
                <span>Edit Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {project.events.map((evt) => (
                <div 
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">{evt.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold uppercase">
                        {evt.type}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{evt.formattedDate} • {evt.time}</span>
                    </p>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span className="truncate">{evt.venue.name} ({evt.venue.cityStateZip})</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">{project.events.length} events scheduled</span>
            <button
              onClick={() => onNavigateTab('events')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
            >
              Add / Modify Event
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {selectedShareLink && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setSelectedShareLink(null)}
          link={selectedShareLink}
          project={project}
          theme={theme}
        />
      )}

      {/* Couple & Nuptials Details Editor Modal */}
      <CoupleDetailsModal
        isOpen={isCoupleModalOpen}
        onClose={() => setIsCoupleModalOpen(false)}
        project={project}
        theme={theme}
        onProjectUpdated={onProjectUpdated}
      />
    </div>
  );
};
