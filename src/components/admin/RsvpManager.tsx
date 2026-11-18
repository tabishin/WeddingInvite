import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Utensils, 
  Music, 
  MessageSquare, 
  Calendar,
  Filter
} from 'lucide-react';
import { RSVPResponse, WeddingProject } from '../../types/wedding';
import { saveWeddingProject } from '../../services/storage';

interface RsvpManagerProps {
  project: WeddingProject;
  onProjectUpdated: (project: WeddingProject) => void;
}

export const RsvpManager: React.FC<RsvpManagerProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkFilter, setLinkFilter] = useState<string>('all');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const showRsvp = project.showRsvp !== false;
  const maxGuests = project.maxGuestsPerRsvp || 3;

  const rsvps = project.rsvps || [];

  const attendingList = rsvps.filter((r) => r.status === 'attending');
  const declinedList = rsvps.filter((r) => r.status === 'declined');
  const totalAttendingGuests = attendingList.reduce((acc, curr) => acc + (curr.guestCount || 1), 0);
  const dietaryCount = rsvps.filter((r) => r.dietaryRequirements && r.dietaryRequirements.trim().length > 0).length;

  const handleToggleRsvp = async (enabled: boolean) => {
    const updated = {
      ...project,
      showRsvp: enabled,
    };
    onProjectUpdated(updated);
    await saveWeddingProject(updated);
    setSaveSuccess(enabled ? 'RSVP enabled: "RSVP to Invitation" button & "Kindly Respond" block are now visible to guests' : 'RSVP hidden: "RSVP to Invitation" button & "Kindly Respond" block are now hidden from guests');
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleUpdateMaxGuests = async (newCount: number) => {
    const count = Math.max(1, Math.min(15, newCount));
    const updatedLinks = (project.invitationLinks || []).map((l) => ({
      ...l,
      maxGuests: count,
    }));
    const updated = {
      ...project,
      maxGuestsPerRsvp: count,
      invitationLinks: updatedLinks,
    };
    onProjectUpdated(updated);
    await saveWeddingProject(updated);
    setSaveSuccess(`Max guests set to ${count} attendee(s) per RSVP response across all invitation links`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSyncToAllLinks = async () => {
    const count = project.maxGuestsPerRsvp || 3;
    const updated = {
      ...project,
      invitationLinks: (project.invitationLinks || []).map((l) => ({
        ...l,
        maxGuests: count,
      })),
    };
    onProjectUpdated(updated);
    await saveWeddingProject(updated);
    setSaveSuccess(`Synchronized max guests limit (${count}) across all ${project.invitationLinks?.length || 0} invitation links!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const filteredRsvps = rsvps.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesLink = linkFilter === 'all' || r.linkCode === linkFilter;
    const matchesSearch =
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.dietaryRequirements && r.dietaryRequirements.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesLink && matchesSearch;
  });

  const handleDeleteRsvp = (id: string) => {
    if (confirm('Delete this RSVP entry?')) {
      const updated = {
        ...project,
        rsvps: project.rsvps.filter((r) => r.id !== id),
      };
      onProjectUpdated(updated);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Guest Name',
      'Email',
      'Phone',
      'Status',
      'Guest Count',
      'Invitation Link',
      'Attending Events',
      'Dietary Restrictions',
      'Song Request',
      'Message to Couple',
      'Submitted Date'
    ];

    const rows = rsvps.map((r) => {
      const eventNames = (r.attendingEventIds || [])
        .map((eid) => project.events.find((e) => e.id === eid)?.name || eid)
        .join('; ');

      return [
        `"${r.guestName.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
        r.guestCount,
        `"${r.linkCode}"`,
        `"${eventNames.replace(/"/g, '""')}"`,
        `"${(r.dietaryRequirements || '').replace(/"/g, '""')}"`,
        `"${(r.songRequest || '').replace(/"/g, '""')}"`,
        `"${(r.messageToCouple || '').replace(/"/g, '""')}"`,
        `"${new Date(r.submittedAt).toLocaleDateString()}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.couple.partner1.toLowerCase()}-${project.couple.partner2.toLowerCase()}-wedding-rsvps.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">
            Guest RSVP Tracker & Meal Counts
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Real-time responses received across all invitation links with guest counts, dietary notes, and event confirmations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={rsvps.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all shadow-xs active:scale-95 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV Spreadsheet</span>
        </button>
      </div>

      {/* RSVP Global Visibility & Max Guest Settings Bar */}
      <div className={`p-5 rounded-2xl border transition-all ${
        showRsvp 
          ? 'bg-rose-50/50 border-rose-200/90 shadow-xs' 
          : 'bg-stone-50 border-stone-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: RSVP Visibility Toggle */}
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              role="switch"
              aria-checked={showRsvp}
              onClick={() => handleToggleRsvp(!showRsvp)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 sm:mt-0 ${
                showRsvp ? 'bg-rose-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showRsvp ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-stone-900">
                  {showRsvp ? 'RSVP Acceptance Active' : 'RSVP Acceptance Hidden'}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  showRsvp 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-stone-200 text-stone-600'
                }`}>
                  {showRsvp ? '✓ Visible to Guests' : '✕ Hidden on Invitation'}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
                {showRsvp
                  ? 'RSVP is enabled. The hero "RSVP to Invitation" button and the "Kindly Respond" block are actively visible to guests.'
                  : 'RSVP is hidden. Both the hero "RSVP to Invitation" button and the "Kindly Respond" section are completely hidden from the wedding invitation.'}
              </p>
            </div>
          </div>

          {/* Right: Guest Number Management (Max Guests Per RSVP) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-200/70">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-700 whitespace-nowrap">
                Max Guests Per RSVP:
              </label>
              <div className="flex items-center border border-stone-300 bg-white rounded-xl shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleUpdateMaxGuests(maxGuests - 1)}
                  disabled={maxGuests <= 1}
                  className="px-3 py-1.5 hover:bg-stone-100 text-stone-600 font-bold text-sm disabled:opacity-30 transition-colors"
                  title="Decrease party size"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-stone-900 min-w-[2.5rem] text-center">
                  {maxGuests}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateMaxGuests(maxGuests + 1)}
                  disabled={maxGuests >= 15}
                  className="px-3 py-1.5 hover:bg-stone-100 text-stone-600 font-bold text-sm disabled:opacity-30 transition-colors"
                  title="Increase party size"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSyncToAllLinks}
              className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50/80 px-3 py-2 rounded-xl border border-rose-200 shadow-xs transition-all whitespace-nowrap active:scale-95"
              title="Apply this guest limit to all invitation links"
            >
              Apply {maxGuests} to All Links
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-3.5 py-2 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total RSVPs</span>
          <p className="text-2xl font-bold text-stone-900 mt-1">{rsvps.length}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Responses submitted</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Attending Guests</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{totalAttendingGuests}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">from {attendingList.length} invitations</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Declined</span>
          <p className="text-2xl font-bold text-stone-700 mt-1">{declinedList.length}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Sending blessings</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Dietary Needs</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{dietaryCount}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Special meal requests</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, dietary note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              All ({rsvps.length})
            </button>
            <button
              onClick={() => setStatusFilter('attending')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'attending' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-600'
              }`}
            >
              Attending ({attendingList.length})
            </button>
            <button
              onClick={() => setStatusFilter('declined')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'declined' ? 'bg-white text-stone-700 shadow-xs' : 'text-stone-600'
              }`}
            >
              Declined ({declinedList.length})
            </button>
          </div>

          {/* Link Type Filter */}
          <select
            value={linkFilter}
            onChange={(e) => setLinkFilter(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="all">All Invitation Links</option>
            {project.invitationLinks.map((l) => (
              <option key={l.code} value={l.code}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RSVPs Table / Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        {filteredRsvps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] uppercase tracking-wider font-bold text-stone-500">
                <tr>
                  <th className="py-3.5 px-6">Guest / Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Party Size</th>
                  <th className="py-3.5 px-4">Invitation Link</th>
                  <th className="py-3.5 px-4">Confirmed Events</th>
                  <th className="py-3.5 px-4">Dietary / Notes</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRsvps.map((r) => {
                  const linkObj = project.invitationLinks.find((l) => l.code === r.linkCode);
                  const isAttending = r.status === 'attending';

                  return (
                    <tr key={r.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-stone-900 text-sm">{r.guestName}</div>
                        <div className="text-stone-500 text-[11px]">{r.email}</div>
                        {r.phone && <div className="text-stone-400 text-[10px]">{r.phone}</div>}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isAttending
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {isAttending ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Attending</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-stone-400" />
                              <span>Declined</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Guest Count */}
                      <td className="py-4 px-4 font-bold text-stone-900 text-sm">
                        {isAttending ? `${r.guestCount} Guest${r.guestCount > 1 ? 's' : ''}` : '0'}
                      </td>

                      {/* Invitation Link */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-mono">
                          {linkObj?.title || r.linkCode}
                        </span>
                      </td>

                      {/* Confirmed Events */}
                      <td className="py-4 px-4">
                        {isAttending ? (
                          <div className="space-y-1">
                            {r.attendingEventIds.map((eid) => {
                              const evt = project.events.find((e) => e.id === eid);
                              return (
                                <span
                                  key={eid}
                                  className="inline-block mr-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200"
                                >
                                  {evt?.name || eid}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">None</span>
                        )}
                      </td>

                      {/* Dietary / Special Notes */}
                      <td className="py-4 px-4 max-w-xs">
                        {r.dietaryRequirements && (
                          <div className="flex items-start gap-1 text-amber-800 font-medium mb-1">
                            <Utensils className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="truncate">{r.dietaryRequirements}</span>
                          </div>
                        )}
                        {r.songRequest && (
                          <div className="flex items-start gap-1 text-stone-500 text-[11px] mb-1">
                            <Music className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="truncate">{r.songRequest}</span>
                          </div>
                        )}
                        {r.messageToCouple && (
                          <div className="flex items-start gap-1 text-stone-600 text-[11px] italic">
                            <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="truncate">"{r.messageToCouple}"</span>
                          </div>
                        )}
                        {!r.dietaryRequirements && !r.songRequest && !r.messageToCouple && (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteRsvp(r.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove RSVP"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-700">No RSVPs match your filter.</p>
            <p className="text-xs text-stone-400">Share your invitation links to start collecting guest responses.</p>
          </div>
        )}
      </div>
    </div>
  );
};
