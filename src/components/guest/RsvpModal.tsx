import React, { useState } from 'react';
import { X, Check, Heart, Sparkles, AlertCircle, Music, Utensils, Send, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { InvitationLink, RSVPResponse, WeddingEvent, WeddingProject, WeddingTheme } from '../../types/wedding';
import { submitRSVPToDB } from '../../services/storage';

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WeddingProject;
  link: InvitationLink;
  events: WeddingEvent[];
  theme: WeddingTheme;
  onRsvpSubmitted: (newProject: WeddingProject) => void;
  targetDateFormatted?: string;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({
  isOpen,
  onClose,
  project,
  link,
  events,
  theme,
  onRsvpSubmitted,
  targetDateFormatted,
}) => {
  const [guestName, setGuestName] = useState(link.recipientName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'attending' | 'declined'>('attending');
  const [attendingEventIds, setAttendingEventIds] = useState<string[]>(events.map((e) => e.id));
  const [guestCount, setGuestCount] = useState(1);
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [messageToCouple, setMessageToCouple] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Saath Studio inspired direct WhatsApp RSVP message generator
  const generateWhatsAppUrl = () => {
    const couple = project.couple.formattedTitle;
    const attendingNames = guestName.trim() || link.recipientName || 'Guest';
    const statusText = status === 'attending' ? 'Attending with pleasure 🎉' : 'Regretfully Declining 🤍';
    const attendingEventsNames = events
      .filter((e) => attendingEventIds.includes(e.id))
      .map((e) => e.name)
      .join(', ');

    let text = `💌 *Wedding RSVP for ${couple}*\n`;
    text += `👤 *Guest:* ${attendingNames}\n`;
    text += `✨ *Status:* ${statusText}\n`;
    if (status === 'attending') {
      text += `👥 *Total Guests:* ${guestCount}\n`;
      if (attendingEventsNames) {
        text += `🎉 *Functions:* ${attendingEventsNames}\n`;
      }
      if (dietaryRequirements.trim()) {
        text += `🍽️ *Dietary:* ${dietaryRequirements.trim()}\n`;
      }
    }
    if (messageToCouple.trim()) {
      text += `💬 *Message:* "${messageToCouple.trim()}"\n`;
    }
    const cleanPhone = (project.contact?.phone || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone ? `phone=${cleanPhone}&` : '';
    return `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(text)}`;
  };

  if (!isOpen || project.showRsvp === false) return null;

  const maxGuestsAllowed = Math.max(
    1,
    Math.min(15, project.maxGuestsPerRsvp ?? link?.maxGuests ?? 3)
  );

  const handleToggleEvent = (eventId: string) => {
    if (attendingEventIds.includes(eventId)) {
      setAttendingEventIds(attendingEventIds.filter((id) => id !== eventId));
    } else {
      setAttendingEventIds([...attendingEventIds, eventId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await submitRSVPToDB({
        linkCode: link.code,
        linkType: link.type,
        guestName: guestName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        status,
        attendingEventIds: status === 'attending' ? attendingEventIds : [],
        guestCount: status === 'attending' ? guestCount : 0,
        dietaryRequirements: dietaryRequirements.trim() || undefined,
        songRequest: songRequest.trim() || undefined,
        messageToCouple: messageToCouple.trim() || undefined,
      });

      // Fire celebratory confetti for attending guests
      if (status === 'attending') {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: [theme.colors.primary, theme.colors.goldOrMetallic, '#F43F5E', '#10B981'],
        });
      }

      setIsSuccess(true);
      if (res.project) {
        onRsvpSubmitted(res.project);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border text-stone-800"
        style={{
          borderColor: theme.colors.cardBorder,
          fontFamily: theme.fontFamily.body,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between border-b"
          style={{
            background: theme.colors.backgroundGradient,
            borderColor: theme.colors.cardBorder,
          }}
        >
          <div>
            <span
              className="text-xs font-bold tracking-wider uppercase block"
              style={{ color: theme.colors.textMuted }}
            >
              RSVP Response
            </span>
            <h3
              className="font-bold text-xl sm:text-2xl mt-0.5"
              style={{
                color: theme.colors.textHeading,
                fontFamily: theme.fontFamily.heading,
              }}
            >
              {project.couple.formattedTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: theme.colors.badgeBg }}
              >
                <Heart className="w-8 h-8" style={{ color: theme.colors.primary }} />
              </div>
              <h4
                className="text-2xl font-bold"
                style={{
                  color: theme.colors.textHeading,
                  fontFamily: theme.fontFamily.heading,
                }}
              >
                {status === 'attending' ? 'Thank you for celebrating with us!' : 'We will miss you!'}
              </h4>
              <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                {status === 'attending'
                  ? `Your RSVP for ${guestCount} guest(s) has been recorded. We cannot wait to see you on ${targetDateFormatted || project.weddingDateFormatted}!`
                  : `Your response has been received. Thank you for your warm wishes and love.`}
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-transform active:scale-95"
                >
                  Close
                </button>
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a]"
                >
                  <span>Share via WhatsApp</span>
                  <span className="text-base">💬</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Attendance Choice */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Will you be attending?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('attending')}
                    className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      status === 'attending'
                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <span>✨ Joyfully Accepts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('declined')}
                    className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      status === 'declined'
                        ? 'border-stone-600 bg-stone-100 text-stone-900 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <span>🕊️ Regretfully Declines</span>
                  </button>
                </div>
              </div>

              {/* Guest Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Sarah & David Miller"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {status === 'attending' && (
                <>
                  {/* Guest Count */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        Total Number of Guests Attending
                      </label>
                      <span className="text-xs text-stone-500 font-medium">
                        Max allowed: {maxGuestsAllowed} {maxGuestsAllowed === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </div>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium text-stone-800"
                    >
                      {Array.from({ length: maxGuestsAllowed }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Guest (Individual)' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Events Checkboxes (Only authorized for this link) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Confirming Events You Will Attend
                    </label>
                    <div className="space-y-2">
                      {events.map((evt) => {
                        const isChecked = attendingEventIds.includes(evt.id);
                        return (
                          <label
                            key={evt.id}
                            onClick={() => handleToggleEvent(evt.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-rose-50/60 border-rose-300'
                                : 'bg-stone-50 border-stone-200 opacity-60'
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-xs text-stone-800">{evt.name}</p>
                              <p className="text-[11px] text-stone-500">
                                {evt.formattedDate} • {evt.time}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                isChecked
                                  ? 'bg-rose-600 border-rose-600 text-white'
                                  : 'border-stone-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Requirements */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1">
                      <Utensils className="w-3.5 h-3.5 text-stone-500" />
                      <span>Dietary Restrictions / Allergies (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={dietaryRequirements}
                      onChange={(e) => setDietaryRequirements(e.target.value)}
                      placeholder="e.g. Vegetarian, Gluten-Free, Nut allergy"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {/* Song Request */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1">
                      <Music className="w-3.5 h-3.5 text-stone-500" />
                      <span>Song Request for Reception (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={songRequest}
                      onChange={(e) => setSongRequest(e.target.value)}
                      placeholder="e.g. Can't Stop the Feeling - Justin Timberlake"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </>
              )}

              {/* Message to the Couple */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Personal Note to the Couple (Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={messageToCouple}
                  onChange={(e) => setMessageToCouple(e.target.value)}
                  placeholder="Leave a congratulatory note or warm wishes..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending RSVP...' : 'Submit Wedding RSVP'}</span>
                </button>

                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    // Also record to database before opening WhatsApp
                    try {
                      await submitRSVPToDB({
                        linkCode: link.code,
                        linkType: link.type,
                        guestName: guestName.trim() || 'Guest',
                        email: email.trim(),
                        phone: phone.trim(),
                        status,
                        attendingEventIds: status === 'attending' ? attendingEventIds : [],
                        guestCount: status === 'attending' ? guestCount : 0,
                        dietaryRequirements,
                        songRequest,
                        messageToCouple,
                      });
                    } catch {}
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-base">💬</span>
                  <span>Or RSVP Directly via WhatsApp</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
