import React, { useState } from 'react';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Eye, 
  Share2, 
  MessageCircle,
  X
} from 'lucide-react';
import { InvitationLink, WeddingProject, WeddingTheme } from '../../types/wedding';
import { QRCodeModal } from '../common/QRCodeModal';
import { SocialSharePreviewStudio } from './SocialSharePreviewStudio';
import { saveWeddingProject } from '../../services/storage';

interface LinkManagerProps {
  project: WeddingProject;
  theme: WeddingTheme;
  onProjectUpdated: (project: WeddingProject) => void;
  onOpenGuestView: (linkCode: string) => void;
}

export const LinkManager: React.FC<LinkManagerProps> = ({
  project,
  theme,
  onProjectUpdated,
  onOpenGuestView,
}) => {
  const [selectedShareLink, setSelectedShareLink] = useState<InvitationLink | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<InvitationLink | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<InvitationLink>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (code: string) => {
    const origin = window.location.origin + window.location.pathname;
    const url = `${origin}?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartCreate = () => {
    setFormData({
      id: 'link-' + Date.now(),
      code: 'vip-family-' + Math.floor(Math.random() * 1000),
      type: 'custom',
      title: 'Custom VIP Invitation',
      description: 'Personalized wedding invitation for designated guests.',
      eventIds: project.events.map((e) => e.id),
      recipientName: 'VIP Guests',
      maxGuests: project.maxGuestsPerRsvp || 3,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
    });
    setIsCreatingNew(true);
    setEditingLink(null);
  };

  const handleStartEdit = (link: InvitationLink) => {
    setEditingLink(link);
    setFormData(JSON.parse(JSON.stringify(link)));
    setIsCreatingNew(false);
  };

  const handleToggleEventInLink = (eventId: string) => {
    const current = formData.eventIds || [];
    if (current.includes(eventId)) {
      setFormData({ ...formData, eventIds: current.filter((id) => id !== eventId) });
    } else {
      setFormData({ ...formData, eventIds: [...current, eventId] });
    }
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.code || !formData.eventIds || formData.eventIds.length === 0) {
      alert('Please provide a Link Title, URL slug code, and select at least one event.');
      return;
    }

    // Clean slug code
    const cleanCode = formData.code.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const prepared: InvitationLink = {
      ...(formData as InvitationLink),
      code: cleanCode,
    };

    let updatedLinks = [...project.invitationLinks];

    if (isCreatingNew) {
      updatedLinks.push(prepared);
      showToast('New invitation link created!');
    } else if (editingLink) {
      const idx = updatedLinks.findIndex((l) => l.id === editingLink.id);
      if (idx >= 0) {
        updatedLinks[idx] = prepared;
      }
      showToast('Invitation link updated!');
    }

    const updatedProject = {
      ...project,
      invitationLinks: updatedLinks,
    };
    onProjectUpdated(updatedProject);

    setIsCreatingNew(false);
    setEditingLink(null);
  };

  const handleDeleteLink = (id: string) => {
    if (project.invitationLinks.length <= 1) {
      alert('You must have at least one invitation link.');
      return;
    }
    if (confirm('Delete this invitation link?')) {
      const updatedLinks = project.invitationLinks.filter((l) => l.id !== id);
      const updatedProject = { ...project, invitationLinks: updatedLinks };
      onProjectUpdated(updatedProject);
      showToast('Invitation link removed.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">
            Invitation Link Types & URL Generator
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Each link type displays only the relevant event information. Guests with the <strong>Wedding Only</strong> link see only the ceremony, <strong>Reception Only</strong> see the evening banquet, and <strong>Wedding + Reception</strong> see the full schedule.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Link</span>
        </button>
      </div>

      {/* Social & WhatsApp Link Preview Card Studio */}
      <SocialSharePreviewStudio
        project={project}
        theme={theme}
        onProjectUpdated={onProjectUpdated}
      />

      {/* Primary 3 Link Cards & Custom Cards */}
      <div className="space-y-6">
        {project.invitationLinks.map((link, idx) => {
          const isCopied = copiedCode === link.code;
          const origin = window.location.origin + window.location.pathname;
          const fullUrl = `${origin}?invite=${link.code}`;
          const assignedEvents = project.events.filter((e) => link.eventIds.includes(e.id));
          const rsvpCount = project.rsvps?.filter((r) => r.linkCode === link.code).length || 0;

          return (
            <div
              key={link.id}
              className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs hover:border-stone-300 transition-all space-y-6"
            >
              {/* Header Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-stone-900">{link.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                        {link.type === 'wedding_only' && 'Wedding Ceremony Only'}
                        {link.type === 'reception_only' && 'Reception Only'}
                        {link.type === 'wedding_reception' && 'Wedding + Reception'}
                        {link.type === 'custom' && 'Custom Pass'}
                      </span>
                    </div>
                    {link.recipientName && (
                      <p className="text-xs text-rose-600 font-medium mt-0.5">
                        Personalized for: {link.recipientName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span>{link.viewsCount || 0} link views</span>
                  <span>•</span>
                  <span>{rsvpCount} RSVPs</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {link.description}
              </p>

              {/* URL Box & Action Controls */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Guest Invitation URL (Shareable Link)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-700 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyLink(link.code)}
                    className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs shrink-0"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedShareLink(link)}
                    className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code & WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onOpenGuestView(link.code)}
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Eye className="w-4 h-4 text-rose-600" />
                    <span>Preview Guest View</span>
                  </button>
                </div>
              </div>

              {/* Authorized Events Breakdown */}
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                  Events Visible to this Guest Link ({assignedEvents.length} of {project.events.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {project.events.map((evt) => {
                    const isIncluded = link.eventIds.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isIncluded
                            ? 'bg-rose-50/50 border-rose-300 text-rose-900 font-semibold'
                            : 'bg-stone-50 border-stone-200 text-stone-400 opacity-50'
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate">{evt.name}</p>
                          <p className="text-[10px] font-normal text-stone-500">
                            {evt.formattedDate}
                          </p>
                        </div>
                        {isIncluded ? (
                          <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                        ) : (
                          <span className="text-[10px] text-stone-400 shrink-0 ml-2">Hidden</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit / Delete link config */}
              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleStartEdit(link)}
                  className="px-3.5 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Configuration</span>
                </button>

                {link.type === 'custom' && (
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="px-3.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Link</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Link Modal */}
      {(isCreatingNew || editingLink) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900">
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {isCreatingNew ? 'Create New Invitation Link' : `Edit "${formData.title}"`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingLink(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Invitation Link Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Wedding Ceremony Only or Reception Gala Only"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    URL Slug Code *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl text-xs text-stone-500 font-mono">
                      ?invite=
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="wedding-only"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-r-xl text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Link Category Type
                  </label>
                  <select
                    value={formData.type || 'wedding_only'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="wedding_only">1. Wedding Only (Ceremony)</option>
                    <option value="reception_only">2. Reception Only (Dinner & Party)</option>
                    <option value="wedding_reception">3. Wedding + Reception (Full)</option>
                    <option value="custom">Custom Guest Pass</option>
                  </select>
                </div>
              </div>

              {/* Personalization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Personalized Recipient Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName || ''}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="e.g. The Davis Family"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Max Allowed Guests for RSVP
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxGuests ?? project.maxGuestsPerRsvp ?? 3}
                    onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description Note
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes shown on link card..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
              </div>

              {/* Assign which events this link sees */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  Select Events Visible for this Invitation Link *
                </label>
                <div className="space-y-2">
                  {project.events.map((evt) => {
                    const isChecked = (formData.eventIds || []).includes(evt.id);
                    return (
                      <label
                        key={evt.id}
                        onClick={() => handleToggleEventInLink(evt.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-rose-50/70 border-rose-300'
                            : 'bg-stone-50 border-stone-200 opacity-60'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-xs text-stone-900">{evt.name}</p>
                          <p className="text-[11px] text-stone-500">{evt.formattedDate} • {evt.time}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-stone-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingLink(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md active:scale-95"
                >
                  Save Invitation Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {selectedShareLink && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setSelectedShareLink(null)}
          link={selectedShareLink}
          project={project}
          theme={theme}
        />
      )}
    </div>
  );
};
