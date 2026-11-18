import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Eye, 
  Sparkles, 
  Search, 
  SlidersHorizontal,
  CheckCircle2,
  DoorClosed,
  Feather,
  Calendar,
  X
} from 'lucide-react';
import { WeddingProject, WeddingTheme, ThemeCategory } from '../../types/wedding';
import { WEDDING_THEMES } from '../../data/themes';
import { saveWeddingProject } from '../../services/storage';
import { RoyalDoorOpening } from '../guest/RoyalDoorOpening';
import { ScratchToRevealDate } from '../guest/ScratchToRevealDate';

interface ThemeSelectorProps {
  project: WeddingProject;
  activeTheme: WeddingTheme;
  onThemeChanged: (theme: WeddingTheme) => void;
  onOpenGuestView: (linkCode?: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  project,
  activeTheme,
  onThemeChanged,
  onOpenGuestView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);
  const [doorPreviewTheme, setDoorPreviewTheme] = useState<WeddingTheme | null>(null);
  const [scratchPreviewTheme, setScratchPreviewTheme] = useState<WeddingTheme | null>(null);

  const doorThemesCount = WEDDING_THEMES.filter(t => t.hasDoorOpening).length;
  const birdThemesCount = WEDDING_THEMES.filter(t => !!t.birdAnimation && t.birdAnimation !== 'none').length;
  const scratchThemesCount = WEDDING_THEMES.filter(t => t.hasScratchToReveal).length;
  const hinduThemesCount = WEDDING_THEMES.filter(t => t.doorOpeningConfig?.culturalType === 'hindu' || t.id.includes('marigold') || t.id.includes('baraat') || t.id.includes('vedic') || t.id.includes('sangeet') || t.id.includes('teakwood')).length;
  const muslimThemesCount = WEDDING_THEMES.filter(t => t.doorOpeningConfig?.culturalType === 'muslim' || t.id.includes('mughal') || t.id.includes('andalusian') || t.id.includes('nikah')).length;

  const categories = [
    { id: 'all', label: `All ${WEDDING_THEMES.length} Themes`, count: WEDDING_THEMES.length },
    { id: 'door-opening', label: '🚪 Royal Door Opening', count: doorThemesCount },
    { id: 'scratch-reveal', label: '✨ Scratch to Reveal Date', count: scratchThemesCount },
    { id: 'birds', label: '🕊️ Live Flying Birds', count: birdThemesCount },
    { id: 'hindu', label: '🛕 Hindu Traditions', count: hinduThemesCount },
    { id: 'muslim', label: '🕌 Muslim Traditions', count: muslimThemesCount },
    { id: 'animated', label: '🌸 Live Falling Petals', count: WEDDING_THEMES.filter(t => t.isLiveAnimated || t.decorations.particleType.includes('petals')).length },
    { id: 'festive', label: '🪅 Festive Traditions', count: WEDDING_THEMES.filter(t => t.category === 'festive').length },
    { id: 'romantic', label: 'Romantic & Blush', count: WEDDING_THEMES.filter(t => t.category === 'romantic').length },
    { id: 'classic', label: 'Classic & Gold', count: WEDDING_THEMES.filter(t => t.category === 'classic').length },
    { id: 'floral', label: 'Floral & Botanical', count: WEDDING_THEMES.filter(t => t.category === 'floral').length },
    { id: 'bohemian', label: 'Bohemian & Terracotta', count: WEDDING_THEMES.filter(t => t.category === 'bohemian').length },
    { id: 'moody', label: 'Moody & Noir', count: WEDDING_THEMES.filter(t => t.category === 'moody').length },
    { id: 'destination', label: 'Destination & Mediterranean', count: WEDDING_THEMES.filter(t => t.category === 'destination').length },
    { id: 'regal', label: 'Regal & Baroque', count: WEDDING_THEMES.filter(t => t.category === 'regal').length },
    { id: 'modern', label: 'Modern & Editorial', count: WEDDING_THEMES.filter(t => t.category === 'modern').length },
    { id: 'minimalist', label: 'Minimalist & Slate', count: WEDDING_THEMES.filter(t => t.category === 'minimalist').length },
  ];

  const filteredThemes = WEDDING_THEMES.filter((theme) => {
    let matchesCat = true;
    if (selectedCategory === 'door-opening') {
      matchesCat = !!theme.hasDoorOpening;
    } else if (selectedCategory === 'scratch-reveal') {
      matchesCat = !!theme.hasScratchToReveal;
    } else if (selectedCategory === 'birds') {
      matchesCat = !!theme.birdAnimation && theme.birdAnimation !== 'none';
    } else if (selectedCategory === 'hindu') {
      matchesCat = theme.doorOpeningConfig?.culturalType === 'hindu' || theme.id.includes('marigold') || theme.id.includes('baraat') || theme.id.includes('vedic') || theme.id.includes('sangeet') || theme.id.includes('teakwood');
    } else if (selectedCategory === 'muslim') {
      matchesCat = theme.doorOpeningConfig?.culturalType === 'muslim' || theme.id.includes('mughal') || theme.id.includes('andalusian') || theme.id.includes('nikah');
    } else if (selectedCategory === 'animated') {
      matchesCat = !!theme.isLiveAnimated || theme.decorations.particleType.includes('petals');
    } else if (selectedCategory !== 'all') {
      matchesCat = theme.category === selectedCategory;
    }
    const matchesSearch =
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (theme.doorOpeningConfig?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyTheme = (theme: WeddingTheme) => {
    onThemeChanged(theme);
    setAppliedToast(`"${theme.name}" applied successfully!`);
    setTimeout(() => setAppliedToast(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {appliedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{appliedToast}</span>
        </div>
      )}

      {/* Interactive 3D Door Opening Preview Modal */}
      {doorPreviewTheme && (
        <RoyalDoorOpening
          theme={doorPreviewTheme}
          coupleTitle={project.couple.formattedTitle}
          partner1={project.couple.partner1}
          partner2={project.couple.partner2}
          weddingDateFormatted={project.weddingDateFormatted}
          isModalPreview={true}
          onClosePreview={() => setDoorPreviewTheme(null)}
        />
      )}

      {/* Interactive Scratch-to-Reveal Date Preview Modal */}
      {scratchPreviewTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-stone-900 rounded-3xl p-6 sm:p-8 border border-amber-400/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">
                    Interactive Scratch-to-Reveal Test
                  </h3>
                  <p className="text-xs text-stone-400">
                    {scratchPreviewTheme.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScratchPreviewTheme(null)}
                className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ScratchToRevealDate
              theme={scratchPreviewTheme}
              project={project}
            />

            <div className="pt-2 text-center text-xs text-stone-400">
              💡 Drag cursor or swipe finger on the gold foil to reveal the wedding date and hear the ascending harp flourish!
            </div>
          </div>
        </div>
      )}

      {/* Header Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-stone-900">
              Aesthetic Wedding Themes ({WEDDING_THEMES.length} Presets)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              {WEDDING_THEMES.length} Curated Presets
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Live Falling Petals</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Choose from {WEDDING_THEMES.length} visually distinct aesthetic themes featuring live animated falling flower petals (roses, marigolds, lilac blooms), curated color palettes, elegant Google font pairings, and ornamental borders.
          </p>
        </div>

        <button
          onClick={() => onOpenGuestView('wedding-reception')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95 shrink-0"
          style={{ backgroundColor: activeTheme.colors.primary }}
        >
          <Eye className="w-4 h-4" />
          <span>Preview Active Theme</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search themes by name, vibe or palette..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs scale-105'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme, index) => {
          const isActive = theme.id === activeTheme.id;

          return (
            <div
              key={theme.id}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group ${
                isActive
                  ? 'ring-2 ring-rose-500 ring-offset-2 shadow-lg border-rose-400 bg-white'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md'
              }`}
            >
              {/* Card Header / Theme Preview Banner */}
              <div
                className="p-6 relative text-stone-900 border-b overflow-hidden"
                style={{
                  background: theme.colors.backgroundGradient,
                  borderColor: theme.colors.cardBorder,
                }}
              >
                {/* Theme Number & Seal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-stone-800 border border-stone-200 shadow-xs">
                      #{index + 1} • {theme.category.toUpperCase()}
                    </span>
                    {theme.hasDoorOpening && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-xs flex items-center gap-1 animate-pulse">
                        <DoorClosed className="w-2.5 h-2.5" />
                        <span>3D DOORS</span>
                      </span>
                    )}
                    {theme.hasScratchToReveal && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-900 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-950" />
                        <span>SCRATCH DATE</span>
                      </span>
                    )}
                    {theme.birdAnimation && theme.birdAnimation !== 'none' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white shadow-xs flex items-center gap-1">
                        <Feather className="w-2.5 h-2.5" />
                        <span>LIVE BIRDS</span>
                      </span>
                    )}
                    {(theme.isLiveAnimated || theme.decorations.particleType.includes('petals')) && !theme.hasDoorOpening && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white shadow-xs flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>LIVE PETALS</span>
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    )}
                  </div>
                  <span className="text-2xl select-none">{theme.decorations.sealEmoji}</span>
                </div>

                {/* Theme Name in Theme Heading Font */}
                <div className="mt-4">
                  <h3
                    className="text-xl font-bold tracking-tight"
                    style={{
                      fontFamily: theme.fontFamily.heading,
                      color: theme.colors.textHeading,
                    }}
                  >
                    {theme.name}
                  </h3>
                  <p
                    className="text-xs italic mt-0.5"
                    style={{
                      fontFamily: theme.fontFamily.script,
                      color: theme.colors.primary,
                    }}
                  >
                    Sophia & Alexander
                  </p>
                </div>

                {/* Color Palette Swatches */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-black/10">
                  <span className="text-[10px] font-semibold text-stone-600">Palette:</span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: theme.colors.primary }}
                      title={`Primary: ${theme.colors.primary}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title={`Secondary: ${theme.colors.secondary}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: theme.colors.goldOrMetallic }}
                      title={`Metallic: ${theme.colors.goldOrMetallic}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: theme.colors.background }}
                      title={`Background: ${theme.colors.background}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: theme.colors.badgeBg }}
                      title={`Badge: ${theme.colors.badgeBg}`}
                    />
                  </div>
                </div>
              </div>

              {/* Theme Specs & Details */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {theme.tagline}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    <div>
                      <span className="font-semibold text-stone-700 block">Typography:</span>
                      <span className="truncate block font-mono">{theme.fontFamily.heading.split(',')[0].replace(/'/g, '')}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700 block">Particles / Birds:</span>
                      <span className="capitalize block truncate">{theme.birdAnimation && theme.birdAnimation !== 'none' ? `🕊️ ${theme.birdAnimation}` : theme.decorations.particleType}</span>
                    </div>
                    {theme.doorOpeningConfig && (
                      <div className="col-span-2 pt-1.5 mt-1 border-t border-dashed border-amber-200">
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <DoorClosed className="w-3 h-3 text-amber-700" />
                          <span>3D Gate: {theme.doorOpeningConfig.title}</span>
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          Arch: {theme.doorOpeningConfig.archShape} • Knocker: {theme.doorOpeningConfig.knockerType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-stone-100 flex items-center gap-2">
                  <button
                    onClick={() => handleApplyTheme(theme)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Current Active Theme</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Apply This Theme</span>
                      </>
                    )}
                  </button>

                  {theme.hasDoorOpening && (
                    <button
                      onClick={() => setDoorPreviewTheme(theme)}
                      className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                      title="Test 3D Door Opening Sequence"
                    >
                      <DoorClosed className="w-3.5 h-3.5 text-amber-700" />
                      <span>Test Gate</span>
                    </button>
                  )}

                  {theme.hasScratchToReveal && (
                    <button
                      onClick={() => setScratchPreviewTheme(theme)}
                      className="py-2.5 px-3 rounded-xl border border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                      title="Test Interactive Scratch-to-Reveal Date Card"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Test Scratch</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleApplyTheme(theme);
                      onOpenGuestView('wedding-reception');
                    }}
                    title="Apply & Preview immediately"
                    className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
