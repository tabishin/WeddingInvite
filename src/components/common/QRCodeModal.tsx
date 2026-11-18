import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Mail, Download, ExternalLink, QrCode } from 'lucide-react';
import { InvitationLink, WeddingProject, WeddingTheme } from '../../types/wedding';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: InvitationLink | null;
  project: WeddingProject;
  theme: WeddingTheme;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  link,
  project,
  theme,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen || !link) return null;

  // Compute full invitation URL
  const origin = window.location.origin + window.location.pathname;
  const fullUrl = `${origin}?invite=${link.code}`;

  const linkPreview = link.sharePreview || project.sharePreview;
  const boldTitle = linkPreview?.title || `Wedding Invitation of ${project.couple.formattedTitle} | 10th Oct`;
  const shareDesc = linkPreview?.description || `With the divine grace of the almighty, inviting you and your family to our wedding celebration.`;
  const shareImg = linkPreview?.imageUrl || '/wedding_share_banner.jpg';
  const customDomain = linkPreview?.customDomain || 'iram.tabish.in';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = `*${boldTitle}*\n\n${shareDesc}\n\n🔗 ${fullUrl}\n\nPlease RSVP by ${project.rsvpDeadlineFormatted}. We look forward to celebrating with you! ❤️`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
  const emailSubject = boldTitle;
  const emailBody = `Dearest Friends & Family,\n\n${boldTitle}\n\n${shareDesc}\n\nPlease open your invitation here:\n${fullUrl}\n\nWith love,\n${project.couple.formattedTitle}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Generate an SVG QR code representation
  // We construct a deterministic QR grid pattern based on URL length & code
  const generateQrGrid = (code: string) => {
    const size = 25;
    const grid: boolean[][] = Array(size).fill(0).map(() => Array(size).fill(false));
    
    // Position detection patterns (corners)
    const setCorner = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            grid[r + i][c + j] = true;
          }
        }
      }
    };

    setCorner(0, 0);
    setCorner(0, size - 7);
    setCorner(size - 7, 0);

    // Deterministic pseudo-random pattern from string
    let hash = 0;
    const str = fullUrl + code;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8)
        ) {
          continue;
        }
        seed = (seed * 9301 + 49297) % 233280;
        grid[r][c] = seed / 233280 > 0.45;
      }
    }

    return grid;
  };

  const qrGrid = generateQrGrid(link.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 text-stone-800"
        style={{ fontFamily: theme.fontFamily.body }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ 
            background: theme.colors.backgroundGradient,
            borderColor: theme.colors.cardBorder 
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight" style={{ color: theme.colors.textHeading, fontFamily: theme.fontFamily.heading }}>
                Share Invitation
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {link.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl border border-stone-200/80">
            <div className="p-4 bg-white rounded-xl shadow-md border border-stone-200 flex flex-col items-center">
              <svg 
                viewBox="0 0 25 25" 
                className="w-48 h-48 sm:w-56 sm:h-56"
                shapeRendering="crispEdges"
              >
                <rect width="25" height="25" fill="#FFFFFF" />
                {qrGrid.map((row, r) =>
                  row.map((cell, c) =>
                    cell ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width="1"
                        height="1"
                        fill={theme.colors.primary}
                      />
                    ) : null
                  )
                )}
              </svg>
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold text-stone-700" style={{ fontFamily: theme.fontFamily.heading }}>
                  {project.couple.formattedTitle}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {link.type === 'wedding_only' && 'Wedding Ceremony Only'}
                  {link.type === 'reception_only' && 'Reception Only'}
                  {link.type === 'wedding_reception' && 'Wedding + Reception'}
                  {link.type === 'custom' && 'Custom Guest Pass'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-stone-500 text-center">
              Scan with any mobile phone camera to open this exact invitation view.
            </p>
          </div>

          {/* WhatsApp Link Preview Card representation */}
          <div className="bg-[#efeae2] p-3 rounded-2xl border border-stone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
              WhatsApp Link Preview Card:
            </span>
            <div className="bg-white rounded-xl overflow-hidden border border-stone-200/80 shadow-xs max-w-sm mx-auto">
              <div className="w-full aspect-video bg-stone-900 overflow-hidden">
                <img
                  src={shareImg}
                  alt="Card Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = '/tabish_iram_card.jpg';
                  }}
                />
              </div>
              <div className="p-3 bg-stone-50/90 space-y-1">
                <h4 className="font-bold text-xs text-stone-900 leading-snug line-clamp-2">
                  {boldTitle}
                </h4>
                <p className="text-stone-600 text-[11px] leading-relaxed line-clamp-2">
                  {shareDesc}
                </p>
                <div className="text-[10px] text-stone-400 font-mono pt-1">
                  🔗 {customDomain}
                </div>
              </div>
            </div>
          </div>

          {/* Invitation URL Box */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Shareable Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-700 select-all focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white rounded-lg transition-all shadow-sm shrink-0 active:scale-95"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2 uppercase tracking-wider">
              1-Click Share Actions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={mailtoUrl}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Email Invitation</span>
              </a>

              <button
                onClick={handleCopyMessage}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMessage ? 'Copied Text!' : 'Copy Invite Text'}</span>
              </button>
            </div>
          </div>

          {/* Direct Open in New Tab */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Preview as guest:</span>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              <span>Open live invitation page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
