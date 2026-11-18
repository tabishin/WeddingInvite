import React, { useState } from 'react';
import { Gift, Heart, Send, Copy, Check, ExternalLink, Sparkles, MessageSquareHeart } from 'lucide-react';
import { WeddingProject, WeddingTheme } from '../../types/wedding';
import { submitRSVPToDB } from '../../services/storage';

interface GiftRegistrySectionProps {
  project: WeddingProject;
  theme: WeddingTheme;
  headingFont: string;
  bodyFont: string;
  onProjectUpdated: (project: WeddingProject) => void;
}

export const GiftRegistrySection: React.FC<GiftRegistrySectionProps> = ({
  project,
  theme,
  headingFont,
  bodyFont,
  onProjectUpdated,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [blessingName, setBlessingName] = useState('');
  const [blessingText, setBlessingText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBlessing, setSubmittedBlessing] = useState(false);
  const [showAllWishes, setShowAllWishes] = useState(false);

  const registryUrl = project.giftRegistryUrl || 'https://www.zola.com/registry/sample';

  const handleCopyRegistry = () => {
    navigator.clipboard.writeText(registryUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Collect all messages from RSVPs
  const existingWishes = (project.rsvps || [])
    .filter((r) => r.messageToCouple && r.messageToCouple.trim().length > 0)
    .map((r) => ({
      name: r.guestName,
      message: r.messageToCouple!,
      date: r.submittedAt,
    }));

  const handleSendBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blessingName.trim() || !blessingText.trim()) return;

    setIsSubmitting(true);
    try {
      const activeLinkCode = project.invitationLinks[0]?.code || '3';
      const res = await submitRSVPToDB({
        linkCode: activeLinkCode,
        linkType: 'wedding_reception',
        guestName: blessingName.trim(),
        email: `${blessingName.toLowerCase().replace(/\s+/g, '')}@blessings.guest`,
        status: 'attending',
        attendingEventIds: [],
        guestCount: 1,
        messageToCouple: blessingText.trim(),
      });

      setSubmittedBlessing(true);
      setBlessingName('');
      setBlessingText('');
      if (res.project) {
        onProjectUpdated(res.project);
      }
      setTimeout(() => setSubmittedBlessing(false), 4000);
    } catch (err) {
      console.error('Failed to submit blessing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showRegistry = project.showGiftRegistry !== false;
  const showWishes = project.showWishes !== false;

  if (!showRegistry && !showWishes) {
    return null;
  }

  // Section title and subtitle dynamically adapts to visible components
  const sectionTitle = showRegistry && showWishes
    ? 'Gift Registry & Wishes'
    : showRegistry
    ? 'Nuptial Gift Registry'
    : 'Warm Wishes & Blessings';

  const sectionSubtitle = showRegistry && showWishes
    ? 'Your presence is the greatest gift of all. If you wish to send a token of love or warm wishes, explore below.'
    : showRegistry
    ? 'Having you celebrate with us is what means the most. For guests who have expressed an interest in celebrating with a gift, explore below.'
    : 'Send your heartfelt love, prayers, and celebratory blessings to the couple.';

  return (
    <section className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-xl mx-auto">
        <span
          className="text-xs font-bold uppercase tracking-widest block mb-1"
          style={{ color: theme.colors.goldOrMetallic }}
        >
          Love & Blessings
        </span>
        <h2
          className="text-3xl sm:text-4xl font-bold"
          style={{
            color: theme.colors.textHeading,
            fontFamily: headingFont,
          }}
        >
          {sectionTitle}
        </h2>
        <p className="text-xs sm:text-sm mt-2" style={{ color: theme.colors.textMuted, fontFamily: bodyFont }}>
          {sectionSubtitle}
        </p>
      </div>

      <div className={showRegistry && showWishes ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "max-w-xl mx-auto w-full"}>
        {/* Gift Registry Card */}
        {showRegistry && (
        <div
          className="rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            boxShadow: theme.decorations.cardShadow,
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${theme.colors.primary}15`,
                  color: theme.colors.primary,
                }}
              >
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.textHeading, fontFamily: headingFont }}>
                  Nuptial Gift Registry
                </h3>
                <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                  Curated with love for our new beginning
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: theme.colors.textBody }}>
              Having you celebrate with us is what means the most. For guests who have expressed an interest in celebrating with a gift, we have assembled a wedding registry.
            </p>

            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-stone-200/50 flex items-center justify-between gap-2 mb-6">
              <span className="text-xs font-mono text-stone-600 dark:text-stone-300 truncate max-w-[220px] sm:max-w-xs">
                {registryUrl}
              </span>
              <button
                onClick={handleCopyRegistry}
                className="p-2 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold shadow-xs hover:bg-stone-100 transition-colors flex items-center gap-1.5 shrink-0"
                title="Copy Registry Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <a
              href={registryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm text-center shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <span>Explore Wedding Registry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        )}

        {/* Digital Guestbook / Warm Blessings Card */}
        {showWishes && (
        <div
          className="rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            boxShadow: theme.decorations.cardShadow,
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${theme.colors.goldOrMetallic}20`,
                  color: theme.colors.goldOrMetallic,
                }}
              >
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.textHeading, fontFamily: headingFont }}>
                  Warm Wishes & Blessings
                </h3>
                <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                  Send heartfelt love to the couple
                </span>
              </div>
            </div>

            {/* Quick Blessing Input Form */}
            <form onSubmit={handleSendBlessing} className="space-y-3 mb-5">
              <input
                type="text"
                value={blessingName}
                onChange={(e) => setBlessingName(e.target.value)}
                placeholder="Your Name (e.g. Aunt Fatima & Uncle Tariq)"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white/70 dark:bg-stone-800/70"
                style={{ borderColor: theme.colors.cardBorder, color: theme.colors.textHeading }}
                required
              />
              <textarea
                value={blessingText}
                onChange={(e) => setBlessingText(e.target.value)}
                rows={2}
                placeholder="Write your prayers, blessings, or wedding advice..."
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white/70 dark:bg-stone-800/70 resize-none"
                style={{ borderColor: theme.colors.cardBorder, color: theme.colors.textHeading }}
                required
              />
              <div className="flex items-center justify-between">
                {submittedBlessing ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Blessing delivered with love!</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">Blessings appear in couple's memory book</span>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Blessing'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Recent Wishes Wall */}
          {existingWishes.length > 0 && (
            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-2">
                Recent Guest Blessings ({existingWishes.length})
              </span>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {(showAllWishes ? existingWishes : existingWishes.slice(0, 2)).map((wish, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-left border border-stone-100 dark:border-stone-800 text-xs"
                  >
                    <p className="italic text-stone-700 dark:text-stone-300">"{wish.message}"</p>
                    <span className="text-[10px] font-bold mt-1 block" style={{ color: theme.colors.primary }}>
                      — {wish.name}
                    </span>
                  </div>
                ))}
              </div>
              {existingWishes.length > 2 && (
                <button
                  onClick={() => setShowAllWishes(!showAllWishes)}
                  className="text-[11px] font-semibold hover:underline mt-2 block"
                  style={{ color: theme.colors.primary }}
                >
                  {showAllWishes ? 'Show less' : `View all ${existingWishes.length} wishes`}
                </button>
              )}
            </div>
          )}
        </div>
        )}
      </div>
    </section>
  );
};
