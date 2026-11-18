import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Sparkles, 
  Check, 
  Globe, 
  BookOpen, 
  Languages, 
  CheckCircle2, 
  Eye, 
  RotateCcw,
  SlidersHorizontal,
  Plus,
  Link as LinkIcon,
  Search,
  ExternalLink
} from 'lucide-react';
import { WeddingProject, WeddingTheme, LanguageScript, TypographySettings } from '../../types/wedding';
import { 
  SUPPORTED_FONTS, 
  INVOCATION_PRESETS, 
  FontOption, 
  InvocationPreset,
  loadGoogleFont,
  loadCustomFontStylesheet
} from '../../data/fontOptions';
import { saveWeddingProject } from '../../services/storage';

interface FontLanguageStudioProps {
  project: WeddingProject;
  theme: WeddingTheme;
  onProjectUpdated: (project: WeddingProject) => void;
  onOpenGuestView: (linkCode?: string) => void;
}

export const FontLanguageStudio: React.FC<FontLanguageStudioProps> = ({
  project,
  theme,
  onProjectUpdated,
  onOpenGuestView,
}) => {
  const currentTypography: TypographySettings = project.typography || {
    languageScript: 'english',
    headingFont: theme.fontFamily.heading,
    scriptFont: theme.fontFamily.script,
    bodyFont: theme.fontFamily.body,
    auspiciousInvocation: project.announcementTitle || 'Together with their families',
    isRTL: false,
  };

  const [selectedScript, setSelectedScript] = useState<LanguageScript>(currentTypography.languageScript || 'english');
  const [headingFont, setHeadingFont] = useState<string>(currentTypography.headingFont);
  const [scriptFont, setScriptFont] = useState<string>(currentTypography.scriptFont);
  const [bodyFont, setBodyFont] = useState<string>(currentTypography.bodyFont);
  const [customFontInput, setCustomFontInput] = useState<string>('');
  const [customFontUrl, setCustomFontUrl] = useState<string>(currentTypography.customFontUrl || '');
  const [targetFontSlot, setTargetFontSlot] = useState<'heading' | 'script' | 'body'>('heading');
  const [invocationText, setInvocationText] = useState<string>(currentTypography.auspiciousInvocation || '');
  const [isRTL, setIsRTL] = useState<boolean>(!!currentTypography.isRTL);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load active fonts on mount or change
  useEffect(() => {
    loadGoogleFont(headingFont);
    loadGoogleFont(scriptFont);
    loadGoogleFont(bodyFont);
    if (customFontUrl) {
      loadCustomFontStylesheet(customFontUrl);
    }
  }, [headingFont, scriptFont, bodyFont, customFontUrl]);

  const scriptTabs: { id: LanguageScript; label: string; nativeName: string; flag: string; defaultRTL: boolean }[] = [
    { id: 'english', label: 'English & Latin', nativeName: 'Latin Classical', flag: '🌐', defaultRTL: false },
    { id: 'urdu', label: 'Urdu', nativeName: 'اردو (Nastaliq)', flag: '🇵🇰', defaultRTL: true },
    { id: 'hindi', label: 'Hindi', nativeName: 'हिंदी (Devanagari)', flag: '🇮🇳', defaultRTL: false },
    { id: 'arabic', label: 'Arabic', nativeName: 'العربية (Calligraphy)', flag: '🇦🇪', defaultRTL: true },
    { id: 'custom', label: 'Custom Font Option', nativeName: 'Any Google Web Font', flag: '✨', defaultRTL: false },
  ];

  const filteredFonts = SUPPORTED_FONTS.filter((f) => {
    if (selectedScript === 'english') return f.category === 'english';
    if (selectedScript === 'urdu') return f.category === 'urdu' || f.category === 'arabic';
    if (selectedScript === 'hindi') return f.category === 'hindi';
    if (selectedScript === 'arabic') return f.category === 'arabic';
    if (selectedScript === 'custom') return f.category === 'custom' || f.category === 'english';
    return true;
  });

  const availableInvocations = INVOCATION_PRESETS.filter((p) => {
    if (selectedScript === 'custom') return true;
    return p.language === selectedScript;
  });

  const handleSelectScript = (script: LanguageScript) => {
    setSelectedScript(script);
    const tab = scriptTabs.find((t) => t.id === script);
    const newRTL = tab ? tab.defaultRTL : false;
    setIsRTL(newRTL);

    // Auto-select best font presets for this script
    if (script === 'urdu') {
      const h = "'Noto Nastaliq Urdu', serif";
      const s = "'Gulzar', serif";
      const b = "'Amiri', serif";
      setHeadingFont(h);
      setScriptFont(s);
      setBodyFont(b);
      loadGoogleFont(h);
      loadGoogleFont(s);
      loadGoogleFont(b);
      setInvocationText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
    } else if (script === 'hindi') {
      const h = "'Rozha One', serif";
      const s = "'Yatra One', cursive";
      const b = "'Noto Serif Devanagari', serif";
      setHeadingFont(h);
      setScriptFont(s);
      setBodyFont(b);
      loadGoogleFont(h);
      loadGoogleFont(s);
      loadGoogleFont(b);
      setInvocationText('॥ श्री गणेशाय नमः ॥');
    } else if (script === 'arabic') {
      const h = "'Amiri', serif";
      const s = "'Aref Ruqaa', cursive";
      const b = "'Cairo', sans-serif";
      setHeadingFont(h);
      setScriptFont(s);
      setBodyFont(b);
      loadGoogleFont(h);
      loadGoogleFont(s);
      loadGoogleFont(b);
      setInvocationText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
    } else if (script === 'custom') {
      const h = "'Cinzel Decorative', serif";
      const s = "'Allura', cursive";
      const b = "'Montserrat', sans-serif";
      setHeadingFont(h);
      setScriptFont(s);
      setBodyFont(b);
      loadGoogleFont(h);
      loadGoogleFont(s);
      loadGoogleFont(b);
      setInvocationText('Celebrating love, family, and new beginnings');
    } else {
      setHeadingFont(theme.fontFamily.heading);
      setScriptFont(theme.fontFamily.script);
      setBodyFont(theme.fontFamily.body);
      setInvocationText('Together with their families');
    }
  };

  const handleApplyPreset = (preset: InvocationPreset) => {
    setInvocationText(preset.text);
    if (preset.fontFamily) {
      setHeadingFont(preset.fontFamily);
      loadGoogleFont(preset.fontFamily);
    }
  };

  const handleApplyCustomFont = (fontName: string, slot: 'heading' | 'script' | 'body') => {
    if (!fontName.trim()) return;
    const cleanName = fontName.trim();
    loadGoogleFont(cleanName);
    const cssFamily = `'${cleanName}', sans-serif`;

    if (slot === 'heading') setHeadingFont(cssFamily);
    if (slot === 'script') setScriptFont(cssFamily);
    if (slot === 'body') setBodyFont(cssFamily);

    setToastMessage(`Applied "${cleanName}" to ${slot} font!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleApplyCustomFontUrl = () => {
    if (customFontUrl) {
      loadCustomFontStylesheet(customFontUrl);
      setToastMessage('Loaded custom font stylesheet URL!');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleSaveTypography = () => {
    const updatedTypography: TypographySettings = {
      languageScript: selectedScript,
      headingFont,
      scriptFont,
      bodyFont,
      auspiciousInvocation: invocationText,
      isRTL,
      customFontUrl: customFontUrl || undefined,
    };

    const updatedProject: WeddingProject = {
      ...project,
      typography: updatedTypography,
      announcementTitle: invocationText || project.announcementTitle,
    };

    onProjectUpdated(updatedProject);

    setToastMessage(`Saved typography settings successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetToThemeDefaults = () => {
    setSelectedScript('english');
    setHeadingFont(theme.fontFamily.heading);
    setScriptFont(theme.fontFamily.script);
    setBodyFont(theme.fontFamily.body);
    setInvocationText('Together with their families');
    setIsRTL(false);
    setCustomFontUrl('');

    const updatedTypography: TypographySettings = {
      languageScript: 'english',
      headingFont: theme.fontFamily.heading,
      scriptFont: theme.fontFamily.script,
      bodyFont: theme.fontFamily.body,
      auspiciousInvocation: 'Together with their families',
      isRTL: false,
    };

    const updatedProject: WeddingProject = {
      ...project,
      typography: updatedTypography,
    };

    onProjectUpdated(updatedProject);
    setToastMessage('Reset typography to active theme defaults.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-stone-900">
              Multilingual Typography & Custom Font Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              <span>Urdu • Hindi • Arabic • Custom Fonts</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Customize typography across your entire invitation. Select authentic Urdu Nastaliq, Hindi Devanagari, Arabic Calligraphy, or specify any custom Google Font name for your wedding cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetToThemeDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Theme Default Fonts</span>
          </button>

          <button
            onClick={() => onOpenGuestView('3')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview in Guest Card</span>
          </button>
        </div>
      </div>

      {/* Script Selection Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
          Select Typography / Script Mode
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {scriptTabs.map((tab) => {
            const isSelected = selectedScript === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectScript(tab.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{tab.flag}</span>
                  {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-xs font-bold text-stone-900">{tab.label}</p>
                <p className="text-[11px] text-stone-500 font-medium truncate">{tab.nativeName}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* CUSTOM FONT BUILDER (Shown prominently when Custom Font Option is active or can be opened) */}
      <div className="bg-gradient-to-r from-amber-50/70 via-rose-50/50 to-amber-50/70 p-6 rounded-3xl border border-amber-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Custom Web Font Generator (Google Fonts)
              </h3>
              <p className="text-xs text-stone-600">
                Type any font family from Google Fonts (e.g. <em>Marcellus, Bodoni Moda, Allura, Tangerine, Cinzel Decorative, Sacramento, Prata</em>) and apply it instantly.
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-white font-bold text-amber-800 border border-amber-200 self-start sm:self-auto">
            Live WebFont Injection
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Google Font Name
            </label>
            <input
              type="text"
              value={customFontInput}
              onChange={(e) => setCustomFontInput(e.target.value)}
              placeholder="e.g. Cinzel Decorative or Allura or Marcellus"
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Apply Target Slot
            </label>
            <div className="flex items-center rounded-xl border border-amber-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setTargetFontSlot('heading')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                  targetFontSlot === 'heading' ? 'bg-amber-600 text-white' : 'text-stone-700 hover:bg-amber-50'
                }`}
              >
                Heading
              </button>
              <button
                type="button"
                onClick={() => setTargetFontSlot('script')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                  targetFontSlot === 'script' ? 'bg-purple-600 text-white' : 'text-stone-700 hover:bg-amber-50'
                }`}
              >
                Script
              </button>
              <button
                type="button"
                onClick={() => setTargetFontSlot('body')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors ${
                  targetFontSlot === 'body' ? 'bg-emerald-600 text-white' : 'text-stone-700 hover:bg-amber-50'
                }`}
              >
                Body
              </button>
            </div>
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="button"
              onClick={() => handleApplyCustomFont(customFontInput, targetFontSlot)}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Load & Apply Font</span>
            </button>
          </div>
        </div>

        {/* Quick Luxury Fonts Chips */}
        <div className="pt-2 border-t border-amber-200/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-2">
            Popular Luxury & Decorative Presets (Click to Test):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Cinzel Decorative', slot: 'heading', label: '👑 Cinzel Decorative' },
              { name: 'Allura', slot: 'script', label: '✒️ Allura Script' },
              { name: 'Pinyon Script', slot: 'script', label: '💌 Pinyon Script' },
              { name: 'Parisienne', slot: 'script', label: '🌹 Parisienne' },
              { name: 'Marcellus', slot: 'heading', label: '🏛️ Marcellus' },
              { name: 'Bodoni Moda', slot: 'heading', label: '✨ Bodoni Moda' },
              { name: 'Prata', slot: 'heading', label: '💎 Prata' },
              { name: 'Tangerine', slot: 'script', label: '🕊️ Tangerine' },
              { name: 'Montserrat', slot: 'body', label: '📖 Montserrat' },
              { name: 'Sacramento', slot: 'script', label: '🌸 Sacramento' },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setCustomFontInput(item.name);
                  handleApplyCustomFont(item.name, item.slot as any);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-stone-800 border border-amber-200 text-xs font-medium hover:border-amber-400 hover:shadow-xs transition-all active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Font Stylesheet URL (Optional) */}
        <div className="pt-2">
          <details className="text-xs text-stone-600">
            <summary className="font-semibold cursor-pointer text-amber-900 hover:underline">
              Advanced: Custom Font Stylesheet URL / External CSS
            </summary>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="url"
                value={customFontUrl}
                onChange={(e) => setCustomFontUrl(e.target.value)}
                placeholder="https://use.typekit.net/xxxx.css or https://fonts.cdnfonts.com/css/..."
                className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleApplyCustomFontUrl}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Load CSS
              </button>
            </div>
          </details>
        </div>
      </div>

      {/* Studio Grid: Controls on Left, Live Preview Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Font Selection & Invocations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Auspicious Invocation Library */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Auspicious Blessing & Religious Invocations
                </h3>
              </div>
              <span className="text-[11px] text-stone-500">
                1-Click Cultural Presets
              </span>
            </div>

            {/* Presets Badges */}
            <div className="space-y-2">
              {availableInvocations.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => handleApplyPreset(inv)}
                  className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/40 transition-colors group flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-stone-900" style={{ fontFamily: inv.fontFamily || headingFont }}>
                      {inv.text}
                    </p>
                    {inv.subtext && (
                      <p className="text-[11px] text-stone-500 mt-0.5">{inv.subtext}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md group-hover:bg-amber-200 shrink-0">
                    Use
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Invocation Input */}
            <div className="pt-2 border-t border-stone-100">
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Custom Blessing / Header Text:
              </label>
              <input
                type="text"
                value={invocationText}
                onChange={(e) => setInvocationText(e.target.value)}
                dir={isRTL ? 'rtl' : 'ltr'}
                placeholder="e.g. بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ or ॥ श्री गणेशाय नमः ॥"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/30"
                style={{ fontFamily: headingFont }}
              />
            </div>
          </div>

          {/* Heading Font Selection */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  1. Main Title & Couple Heading Font
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {headingFont.split(',')[0].replace(/'/g, '')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredFonts.map((font) => {
                const isSelected = headingFont.includes(font.name) || headingFont.includes(font.id) || headingFont.toLowerCase().includes(font.name.toLowerCase());
                return (
                  <button
                    key={'heading-' + font.id}
                    onClick={() => {
                      setHeadingFont(font.cssFamily);
                      loadGoogleFont(font.name);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">{font.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    </div>
                    <p 
                      className="text-base font-semibold text-stone-900 mt-1 truncate" 
                      style={{ fontFamily: font.cssFamily }}
                    >
                      {font.sampleHeading}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Script / Calligraphy Accent Font */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  2. Script & Calligraphy Flourish Font
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {scriptFont.split(',')[0].replace(/'/g, '')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredFonts.map((font) => {
                const isSelected = scriptFont.includes(font.name) || scriptFont.includes(font.id) || scriptFont.toLowerCase().includes(font.name.toLowerCase());
                return (
                  <button
                    key={'script-' + font.id}
                    onClick={() => {
                      setScriptFont(font.cssFamily);
                      loadGoogleFont(font.name);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">{font.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <p 
                      className="text-base text-stone-900 mt-1 truncate" 
                      style={{ fontFamily: font.cssFamily }}
                    >
                      {font.sampleScript}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Text & Itinerary Font */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  3. Body & Event Details Font
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {bodyFont.split(',')[0].replace(/'/g, '')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredFonts.map((font) => {
                const isSelected = bodyFont.includes(font.name) || bodyFont.includes(font.id) || bodyFont.toLowerCase().includes(font.name.toLowerCase());
                return (
                  <button
                    key={'body-' + font.id}
                    onClick={() => {
                      setBodyFont(font.cssFamily);
                      loadGoogleFont(font.name);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">{font.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p 
                      className="text-xs text-stone-600 mt-1 truncate" 
                      style={{ fontFamily: font.cssFamily }}
                    >
                      Date, Time, Venue & Program Highlights
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RTL Direction Toggle */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">Right-to-Left (RTL) Text Direction</p>
              <p className="text-[11px] text-stone-500">Recommended for traditional Urdu & Arabic calligraphy layouts</p>
            </div>
            <button
              onClick={() => setIsRTL(!isRTL)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isRTL ? 'bg-indigo-600 text-white shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {isRTL ? '✓ RTL Active' : 'LTR Standard'}
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSaveTypography}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.99] flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Typography to Live Invitation</span>
          </button>
        </div>

        {/* Right Column: Live Interactive Typography Card Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Live Card Typography Preview
            </span>
            <span className="text-xs text-stone-400">
              Theme: {theme.name}
            </span>
          </div>

          {/* Preview Card */}
          <div
            className="rounded-3xl p-6 sm:p-8 text-center border shadow-xl relative overflow-hidden transition-all duration-500"
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
              boxShadow: theme.decorations.cardShadow,
              color: theme.colors.textBody,
            }}
          >
            {/* Top Seal / Motif */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-[1px] w-8" style={{ backgroundColor: theme.colors.goldOrMetallic }} />
              <span className="text-xl">{theme.decorations.sealEmoji}</span>
              <div className="h-[1px] w-8" style={{ backgroundColor: theme.colors.goldOrMetallic }} />
            </div>

            {/* Auspicious Invocation Header */}
            {invocationText && (
              <div className="mb-4">
                <p
                  className="text-lg sm:text-xl font-bold leading-relaxed"
                  style={{
                    color: theme.colors.goldOrMetallic,
                    fontFamily: headingFont,
                  }}
                >
                  {invocationText}
                </p>
              </div>
            )}

            {/* Script Greeting */}
            <p
              className="text-xs uppercase tracking-widest font-semibold mb-2"
              style={{ color: theme.colors.textMuted, fontFamily: bodyFont }}
            >
              Request the honor of your presence
            </p>

            {/* Couple Names in Chosen Heading Font */}
            <h2
              className="text-3xl sm:text-4xl font-bold my-4 leading-tight"
              style={{
                color: theme.colors.textHeading,
                fontFamily: headingFont,
              }}
            >
              {project.couple.formattedTitle}
            </h2>

            {/* Script Tagline */}
            <p
              className="text-base italic my-3"
              style={{
                color: theme.colors.primary,
                fontFamily: scriptFont,
              }}
            >
              "Two souls, one sacred celebration of love"
            </p>

            {/* Date & Location in Body Font */}
            <div
              className="my-5 py-3 border-y border-dashed max-w-xs mx-auto"
              style={{ borderColor: theme.colors.cardBorder }}
            >
              <p
                className="text-base font-bold"
                style={{
                  color: theme.colors.textHeading,
                  fontFamily: headingFont,
                }}
              >
                {project.weddingDateFormatted}
              </p>
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: theme.colors.textMuted, fontFamily: bodyFont }}
              >
                Sacred Wedding & Grand Gala Celebration
              </p>
            </div>

            {/* Button Preview */}
            <div className="mt-6">
              <button
                onClick={handleSaveTypography}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: theme.colors.primary }}
              >
                RSVP to Wedding Invitation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
