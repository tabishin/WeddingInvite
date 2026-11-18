import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  MessageCircle, 
  Link2, 
  RefreshCw, 
  Save, 
  CheckCircle2,
  Info,
  Type,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { WeddingProject, WeddingTheme, SocialShareSettings, InvitationLink } from '../../types/wedding';
import { 
  getLinkAssignedEvents, 
  getEventDefaultSharePreview, 
  getEffectiveShareMetadata 
} from '../../services/shareMetadata';

interface SocialSharePreviewStudioProps {
  project: WeddingProject;
  theme: WeddingTheme;
  onProjectUpdated: (project: WeddingProject) => void;
}

export const SocialSharePreviewStudio: React.FC<SocialSharePreviewStudioProps> = ({
  project,
  theme,
  onProjectUpdated,
}) => {
  const defaultTitle = `Wedding Invitation of ${project.couple.formattedTitle} | 10th Oct`;
  const defaultDesc = `With the divine grace of the almighty, inviting you and your family to our wedding to be held on 11th October at Jogale Banquet from 6:00 PM onwards.`;
  const defaultImage = '/tabish_iram_card.jpg';
  const defaultDomain = 'wed.tabish.in';

  // Active selected link code
  const [selectedLinkCode, setSelectedLinkCode] = useState<string>(() => {
    return project.invitationLinks?.[0]?.code || '1';
  });

  // Track independent draft metadata per link code
  const [draftsByLink, setDraftsByLink] = useState<Record<string, SocialShareSettings>>(() => {
    const initial: Record<string, SocialShareSettings> = {};
    project.invitationLinks?.forEach((link) => {
      if (link.sharePreview) {
        initial[link.code] = { ...link.sharePreview };
      }
    });
    return initial;
  });

  const currentLink = project.invitationLinks?.find((l) => l.code === selectedLinkCode) || project.invitationLinks?.[0];

  // Helper to resolve metadata for a link
  const resolveMetadataForLink = (link: InvitationLink | undefined): SocialShareSettings => {
    if (!link) {
      return getEffectiveShareMetadata(undefined, project);
    }
    if (draftsByLink[link.code]) {
      return draftsByLink[link.code];
    }
    return getEffectiveShareMetadata(link, project);
  };

  const initialMeta = resolveMetadataForLink(currentLink);

  const [title, setTitle] = useState(initialMeta.title);
  const [description, setDescription] = useState(initialMeta.description);
  const [cardSnippet, setCardSnippet] = useState(initialMeta.cardSnippet || '');
  const [imageUrl, setImageUrl] = useState(initialMeta.imageUrl || defaultImage);
  const [customDomain, setCustomDomain] = useState(initialMeta.customDomain || defaultDomain);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedLinkTitle, setSavedLinkTitle] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirtyRef = useRef(false);

  // Safe fallback handler that terminates recursive onError cycles
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = '/tabish_iram_card.jpg';
  };

  // Switch between invitation links while preserving drafts
  const handleSelectLink = (newLinkCode: string) => {
    if (newLinkCode === selectedLinkCode) return;

    // 1. Cache current field values in draft map for the link being switched away from
    if (currentLink) {
      const currentDraft: SocialShareSettings = {
        title,
        description,
        cardSnippet,
        imageUrl,
        customDomain,
      };
      setDraftsByLink((prev) => ({
        ...prev,
        [currentLink.code]: currentDraft,
      }));
    }

    // 2. Set new active link
    setSelectedLinkCode(newLinkCode);

    // 3. Load fields for target link
    const targetLink = project.invitationLinks?.find((l) => l.code === newLinkCode);
    const targetMeta = targetLink
      ? (draftsByLink[targetLink.code] || getEffectiveShareMetadata(targetLink, project))
      : resolveMetadataForLink(undefined);

    setTitle(targetMeta.title);
    setDescription(targetMeta.description);
    setCardSnippet(targetMeta.cardSnippet || '');
    setImageUrl(targetMeta.imageUrl || defaultImage);
    setCustomDomain(targetMeta.customDomain || defaultDomain);
    isDirtyRef.current = false;
  };

  // Auto-fill template generated from the assigned event details
  const handleAutoFillFromEvent = () => {
    if (!currentLink) return;
    const generated = getEventDefaultSharePreview(currentLink, project);
    setTitle(generated.title);
    setDescription(generated.description);
    setCardSnippet(generated.cardSnippet || '');
    isDirtyRef.current = true;
  };

  // Compute live shareable URL for the active link
  const origin = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : '';
  const shareableUrl = `${origin}?invite=${selectedLinkCode}`;

  // Upload image directly to server backend with instant optimistic preview for this specific link
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploading(false);
        return;
      }

      // 1. Instant local preview without waiting for network or flickering
      setImageUrl(dataUrl);
      isDirtyRef.current = true;

      try {
        const res = await fetch('/api/upload-share-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dataUrl, 
            linkCode: selectedLinkCode 
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
          }
        }
      } catch (err) {
        console.error('Error uploading image to server:', err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      alert('Error reading the selected image.');
    };
    reader.readAsDataURL(file);
  };

  // Save specific settings to the currently active link (and any pending link drafts)
  const handleSaveSettings = () => {
    isDirtyRef.current = false;
    const currentSharePreview: SocialShareSettings = {
      title: title.trim() || defaultTitle,
      description: description.trim() || defaultDesc,
      cardSnippet: cardSnippet.trim() || '',
      imageUrl: imageUrl || defaultImage,
      customDomain: customDomain.trim() || defaultDomain,
    };

    // Update draft cache
    const updatedDrafts = {
      ...draftsByLink,
      ...(currentLink ? { [currentLink.code]: currentSharePreview } : {}),
    };
    setDraftsByLink(updatedDrafts);

    // Update project invitationLinks array so each link holds its distinct metadata
    const updatedInvitationLinks = project.invitationLinks.map((link) => {
      if (link.code === selectedLinkCode || (currentLink && link.id === currentLink.id)) {
        return {
          ...link,
          sharePreview: currentSharePreview,
        };
      }
      if (updatedDrafts[link.code]) {
        return {
          ...link,
          sharePreview: updatedDrafts[link.code],
        };
      }
      return {
        ...link,
        sharePreview: link.sharePreview || getEffectiveShareMetadata(link, project),
      };
    });

    // CRITICAL: Preserve neutral general celebration metadata on project.sharePreview!
    // NEVER allow saving a reception or ceremony link to overwrite project.sharePreview!
    const defaultGeneral = getEffectiveShareMetadata(undefined, project);
    const safeProjectSharePreview = (project.sharePreview && !project.sharePreview.title.toLowerCase().includes('reception') && !project.sharePreview.title.toLowerCase().includes('ceremony only'))
      ? project.sharePreview
      : defaultGeneral;

    onProjectUpdated({
      ...project,
      invitationLinks: updatedInvitationLinks,
      sharePreview: safeProjectSharePreview,
    });

    setSavedLinkTitle(currentLink?.title || `Link ${selectedLinkCode}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const [saveAllSuccess, setSaveAllSuccess] = useState(false);

  // Save all link configurations simultaneously
  const handleSaveAllLinks = () => {
    isDirtyRef.current = false;
    const currentSharePreview: SocialShareSettings = {
      title: title.trim() || defaultTitle,
      description: description.trim() || defaultDesc,
      cardSnippet: cardSnippet.trim() || '',
      imageUrl: imageUrl || defaultImage,
      customDomain: customDomain.trim() || defaultDomain,
    };

    const updatedDrafts = {
      ...draftsByLink,
      ...(currentLink ? { [currentLink.code]: currentSharePreview } : {}),
    };
    setDraftsByLink(updatedDrafts);

    const updatedInvitationLinks = project.invitationLinks.map((link) => {
      const explicitDraft = (link.code === selectedLinkCode || (currentLink && link.id === currentLink.id))
        ? currentSharePreview
        : updatedDrafts[link.code];

      return {
        ...link,
        sharePreview: explicitDraft || link.sharePreview || getEffectiveShareMetadata(link, project),
      };
    });

    const defaultGeneral = getEffectiveShareMetadata(undefined, project);
    const safeProjectSharePreview = (project.sharePreview && !project.sharePreview.title.toLowerCase().includes('reception') && !project.sharePreview.title.toLowerCase().includes('ceremony only'))
      ? project.sharePreview
      : defaultGeneral;

    onProjectUpdated({
      ...project,
      invitationLinks: updatedInvitationLinks,
      sharePreview: safeProjectSharePreview,
    });

    setSaveAllSuccess(true);
    setTimeout(() => setSaveAllSuccess(false), 3000);
  };

  // WhatsApp formatted share message (using *text* to make the header bold in WhatsApp chat)
  const formattedWhatsAppText = `*${title.trim()}*\n\n${description.trim()}\n\n🔗 ${shareableUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedWhatsAppText)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedWhatsAppText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleResetToCardSample = () => {
    if (currentLink) {
      const def = getEventDefaultSharePreview(currentLink, project);
      setTitle(def.title);
      setDescription(def.description);
      setCardSnippet(def.cardSnippet || '');
      setImageUrl(def.imageUrl);
      setCustomDomain(def.customDomain);
      isDirtyRef.current = true;
    }
  };

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const currentAssignedEvents = currentLink ? getLinkAssignedEvents(currentLink, project) : [];

  return (
    <div id="social-share-studio" className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div 
        className="px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          background: 'linear-gradient(to right, #fafaf9, #f5f5f4)',
          borderColor: '#e7e5e4'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-stone-900 leading-tight">
                WhatsApp & Social Link Preview Studio
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Per-Link Metadata Active
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize distinct images, bold headlines, and text messages for each invitation link and event.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
          <button
            type="button"
            onClick={handleResetToCardSample}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Reset to event template"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Link</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllLinks}
            className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Save metadata for all links simultaneously"
          >
            {saveAllSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>All Links Saved!</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>Save All Links</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>Saved for {savedLinkTitle}!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save This Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Link & Event Selector Bar */}
      <div className="p-4 sm:p-5 bg-stone-50/90 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Select Link / Event to Customize:
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            Each link saves its own unique WhatsApp card & text
          </span>
        </div>

        {/* Link Cards Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.invitationLinks.map((link) => {
            const isSelected = link.code === selectedLinkCode;
            const linkEvents = getLinkAssignedEvents(link, project);
            const effective = getEffectiveShareMetadata(link, project);
            const hasCustomSaved = Boolean(link.sharePreview?.title);
            const isDraftEdited = Boolean(draftsByLink[link.code]);

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleSelectLink(link.code)}
                className={`text-left p-3 rounded-2xl border transition-all relative flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white/70 hover:bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-stone-900 line-clamp-1">
                      {link.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-600'
                    }`}>
                      ?invite={link.code}
                    </span>
                  </div>

                  {/* Assigned event details */}
                  <div className="text-[11px] text-stone-500 line-clamp-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>
                      {linkEvents.length > 0 
                        ? linkEvents.map(e => `${e.name} (${e.venue.name})`).join(', ')
                        : 'All wedding events'}
                    </span>
                  </div>

                  {/* Active Title Preview */}
                  <div className="mt-1.5 text-[10.5px] font-semibold text-stone-700 bg-stone-50 px-2 py-1 rounded border border-stone-200/60 line-clamp-1">
                    &ldquo;{isSelected ? title : (draftsByLink[link.code]?.title || effective.title)}&rdquo;
                  </div>
                </div>

                {/* Status pill */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px]">
                  {hasCustomSaved ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Custom metadata saved
                    </span>
                  ) : isDraftEdited ? (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Unsaved draft
                    </span>
                  ) : (
                    <span className="text-stone-400 font-medium">
                      Event template
                    </span>
                  )}

                  {isSelected && (
                    <span className="text-emerald-600 font-bold uppercase tracking-wider text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Link Context Bar + Auto-Fill Trigger */}
      {currentLink && (
        <div className="px-6 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-emerald-950">
            <span className="font-semibold">Currently Editing:</span>
            <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              {currentLink.title}
            </span>
            {currentAssignedEvents.length > 0 && (
              <span className="text-emerald-700 text-[11px] hidden md:inline">
                &bull; Event: {currentAssignedEvents[0].name} ({currentAssignedEvents[0].formattedDate})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAutoFillFromEvent}
            className="px-3 py-1 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
            title="Auto-fill title and message from the assigned event details"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Fill from Event Details</span>
          </button>
        </div>
      )}

      {/* Main Studio Body: Editor Controls (Left) + WhatsApp Phone Preview (Right) */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Input Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Image Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Share Card Image / Thumbnail for this Link</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Direct Endpoint Active
              </span>
            </div>

            {/* Current Image Preview & Upload Triggers */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-36 h-20 sm:w-44 sm:h-24 rounded-xl overflow-hidden bg-stone-900 border border-stone-300 shadow-xs shrink-0 group">
                <img
                  src={imageUrl}
                  alt="Share Card Banner"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                  Preview Image
                </div>
              </div>

              <div className="flex-1 w-full space-y-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:border-emerald-500 hover:text-emerald-700 text-stone-800 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isUploading ? 'Uploading to Server...' : 'Upload Image File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('/tabish_iram_card.jpg');
                      isDirtyRef.current = true;
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${imageUrl.includes('tabish_iram_card') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                  >
                    Tabish & Iram Card
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('/wedding_share_banner.jpg');
                      isDirtyRef.current = true;
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${imageUrl.includes('wedding_share_banner') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                  >
                    Floral Art
                  </button>
                </div>

                {uploadSuccess && (
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Uploaded & saved to server for WhatsApp crawlers!</span>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      isDirtyRef.current = true;
                    }}
                    placeholder="Or paste external image URL..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Photos uploaded here are stored directly on the server so WhatsApp&apos;s crawler can fetch them instantly.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Header (Bold) Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-emerald-600" />
                <span>Header / Title for this Link (Rendered in Bold)</span>
              </label>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Bold on WhatsApp
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  isDirtyRef.current = true;
                }}
                placeholder="e.g. Wedding Reception of Iram & Tabish | 11th Oct"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-stone-500">
              This headline appears in <strong>bold text</strong> (*Header*) at the top of the WhatsApp message and link preview card for this link.
            </p>
          </div>

          {/* 3. Full Invitation Message Input (No words cut off) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span>Complete Invitation Message for this Link</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">
                  Never Cut Off in Chat
                </span>
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                {wordCount} words &bull; {description.length} chars
              </span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                isDirtyRef.current = true;
              }}
              placeholder="Write your complete wedding message, date, venue hall name (e.g. Jogale Banquet), timings, and family greetings..."
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y"
            />
            <p className="text-[11px] text-stone-500">
              When shared to WhatsApp, this entire paragraph is posted in the chat bubble so your guests can read every single detail without truncation.
            </p>
          </div>

          {/* 4. Display Domain & Link Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Display Domain / Brand
              </label>
              <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 focus-within:border-emerald-500">
                <Link2 className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => {
                    setCustomDomain(e.target.value);
                    isDirtyRef.current = true;
                  }}
                  placeholder="wed.tabish.in"
                  className="bg-transparent w-full focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Active Invitation Link
              </label>
              <select
                value={selectedLinkCode}
                onChange={(e) => handleSelectLink(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 focus:outline-none focus:border-emerald-500 font-medium"
              >
                {project.invitationLinks.map((link) => (
                  <option key={link.id} value={link.code}>
                    {link.title} ({link.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Share Action Row */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[180px] px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share to WhatsApp (Full Text + Card)</span>
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMessage ? 'Copied Full Invite!' : 'Copy Full Message'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Right: Realistic WhatsApp Mobile Preview (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Live WhatsApp Chat Simulation
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Link: {selectedLinkCode}
              </span>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="rounded-[32px] border-4 border-stone-800 bg-[#efeae2] shadow-xl overflow-hidden relative">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    💍
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs leading-tight">
                      {project.couple.formattedTitle}
                    </h5>
                    <p className="text-[10px] text-emerald-200 leading-tight">online</p>
                  </div>
                </div>
                <div className="text-[10px] text-white/80 font-mono">WhatsApp</div>
              </div>

              {/* Chat Canvas with Wallpaper */}
              <div 
                className="p-3.5 space-y-3 min-h-[420px] flex flex-col justify-end"
                style={{
                  backgroundImage: `radial-gradient(#0000000a 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              >
                {/* Date separator */}
                <div className="text-center my-1">
                  <span className="bg-[#ffffffcc] text-stone-500 text-[10px] font-medium px-2.5 py-0.5 rounded-md shadow-2xs">
                    Today
                  </span>
                </div>

                {/* WhatsApp Message Bubble (Sent) - Showing Full Message & Unfurled Card */}
                <div className="ml-auto w-[96%] bg-[#dcf8c6] rounded-2xl rounded-tr-xs p-2.5 shadow-sm text-stone-800 text-xs border border-emerald-100/60 space-y-2">
                  
                  {/* Part 1: Full Invitation Text in the chat bubble (Never truncated!) */}
                  <div className="px-1 text-stone-900 leading-relaxed text-[11.5px] space-y-1">
                    <p className="font-bold text-stone-950">
                      {title || defaultTitle}
                    </p>
                    <p className="text-stone-800 whitespace-pre-wrap">
                      {description || defaultDesc}
                    </p>
                    <p className="text-emerald-800 font-mono text-[10.5px] break-all underline pt-0.5">
                      {shareableUrl}
                    </p>
                  </div>

                  {/* Part 2: The Unfurled Link Card Container */}
                  <div className="bg-white rounded-xl overflow-hidden border border-stone-200/80 shadow-2xs">
                    {/* Card Top Image */}
                    <div className="relative w-full aspect-video bg-stone-900 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-2.5 bg-stone-50/90 space-y-1">
                      {/* Bold Header */}
                      <h4 className="font-bold text-[12px] text-stone-900 leading-snug line-clamp-2">
                        {title || defaultTitle}
                      </h4>

                      {/* Snippet / Subtitle */}
                      <p className="text-stone-600 text-[10.5px] leading-relaxed line-clamp-2">
                        {cardSnippet || description || defaultDesc}
                      </p>

                      {/* Domain link */}
                      <div className="flex items-center gap-1 text-stone-400 text-[10px] pt-1 border-t border-stone-200/60 font-mono">
                        <Link2 className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{customDomain || 'wed.tabish.in'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bubble Timestamp and Double Checkmarks */}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-stone-500 font-mono pr-1">
                    <span>9:51 AM</span>
                    <span className="text-[#34b7f1] font-bold">✓✓</span>
                  </div>
                </div>

                {/* Helpful caption */}
                <div className="bg-white/80 rounded-xl p-2 text-[10px] text-stone-600 text-center shadow-2xs border border-stone-200/40">
                  ✨ <strong>Full Text Guarantee:</strong> The chat bubble displays your entire message in full, while the card attaches your photo thumbnail and bold title.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
