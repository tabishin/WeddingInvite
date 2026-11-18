import { INITIAL_WEDDING_PROJECT } from '../data/initialData';
import { WeddingProject, WeddingTheme, RSVPResponse, WeddingEvent, PhotoAlbum, WeddingPhoto } from '../types/wedding';
import { WEDDING_THEMES } from '../data/themes';

export const normalizeLinkCode = (code: string | null | undefined): string => {
  if (!code) return '3';
  const c = code.trim().toLowerCase();
  if (c === '1' || c === 'wedding-only' || c === 'ceremony') return '1';
  if (c === '2' || c === 'reception-only' || c === 'reception') return '2';
  if (c === '3' || c === 'wedding-reception' || c === 'all' || c === 'full') return '3';
  return c;
};

// Cleanup any stale local storage key so browsers don't hold obsolete cached state
try {
  localStorage.removeItem('wedding_invitation_portal_data_v1');
} catch (_) {}

/**
 * Returns the server-injected project data from the initial HTML document payload if present.
 * This guarantees instant zero-delay rendering in any new browser or tab.
 */
export function getInjectedProject(): WeddingProject | null {
  if (typeof window !== 'undefined') {
    const injected = (window as any).__INITIAL_WEDDING_PROJECT__;
    if (injected && injected.couple && injected.couple.formattedTitle) {
      return injected as WeddingProject;
    }
  }
  return null;
}

/**
 * Subscribes to real-time project updates via Server-Sent Events (SSE).
 * Automatically handles reconnections and delivers updates instantly across browsers.
 */
export function subscribeToProjectUpdates(onUpdate: (project: WeddingProject) => void): () => void {
  let eventSource: EventSource | null = null;
  let isCancelled = false;

  const connect = () => {
    if (isCancelled) return;
    try {
      eventSource = new EventSource('/api/project/stream', { withCredentials: true });
      
      eventSource.onmessage = (event) => {
        if (!event.data || event.data.startsWith(':')) return;
        try {
          const project = JSON.parse(event.data) as WeddingProject;
          if (project && project.couple) {
            onUpdate(project);
          }
        } catch (e) {
          console.warn('Error parsing live SSE project update:', e);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        if (!isCancelled) {
          // Reconnect with a slight delay
          setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.warn('SSE EventSource creation error:', err);
    }
  };

  connect();

  return () => {
    isCancelled = true;
    eventSource?.close();
  };
}

/**
 * Loads project directly from the lightweight server database.
 * No client-side cache is used, ensuring 100% real-time accuracy across all browsers.
 */
export async function fetchServerWeddingProject(): Promise<WeddingProject | null> {
  try {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const inviteParam = urlParams?.get('invite') || '';
    const query = `_nocache=${Date.now()}${inviteParam ? `&_invite=${encodeURIComponent(inviteParam)}` : ''}`;

    const res = await fetch(`/api/project?${query}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const serverProject = await res.json();
        if (serverProject && serverProject.couple) {
          return serverProject;
        }
      } else {
        console.warn('[Storage] /api/project returned non-JSON response:', contentType);
      }
    }
  } catch (err) {
    console.warn('Unable to query lightweight database API:', err);
  }
  return null;
}

/**
 * Saves and updates the wedding project in the lightweight server database.
 */
export async function saveWeddingProject(project: WeddingProject): Promise<{ success: boolean; project?: WeddingProject }> {
  try {
    console.log('[Storage] Sending POST /api/project with couple:', project.couple);
    const res = await fetch('/api/project', {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(project),
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[Storage] Saved successfully. Resulting couple title:', data.project?.couple?.formattedTitle, 'version:', data.project?.version);
      return { success: true, project: data.project || project };
    } else {
      const errText = await res.text();
      console.error('[Storage] Save request failed:', res.status, errText);
    }
  } catch (err) {
    console.error('Failed to save project to database:', err);
  }
  return { success: false };
}

export interface ActivityLogItem {
  id: string;
  category: 'DATA_SAVE' | 'GUEST_OPEN' | 'RSVP' | 'AUTH' | 'SYSTEM';
  title: string;
  details: string;
  ip?: string;
  createdAt: string;
}

/**
 * Fetches recent server activity logs (data saves, guest URL visits, RSVPs)
 */
export async function fetchActivityLogs(limit = 50): Promise<ActivityLogItem[]> {
  try {
    const res = await fetch(`/api/logs?limit=${limit}&_t=${Date.now()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {
    console.warn('Failed to fetch activity logs:', err);
  }
  return [];
}

/**
 * Resets the lightweight database back to default state
 */
export async function resetWeddingProject(): Promise<WeddingProject> {
  try {
    const res = await fetch('/api/project/reset', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.project || INITIAL_WEDDING_PROJECT;
    }
  } catch (err) {
    console.error('Error resetting database:', err);
  }
  return INITIAL_WEDDING_PROJECT;
}

export function getThemeById(themeId: string): WeddingTheme {
  const found = WEDDING_THEMES.find((t) => t.id === themeId);
  return found || WEDDING_THEMES[0];
}

/**
 * Record invitation link visit counter in database
 */
export function recordLinkView(linkCode: string): void {
  try {
    fetch('/api/project/views', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkCode }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error recording link view:', e);
  }
}

/**
 * Submit RSVP directly to the lightweight server database
 */
export async function submitRSVPToDB(rsvp: Omit<RSVPResponse, 'id' | 'submittedAt'>): Promise<{ success: boolean; newRSVP?: RSVPResponse; project?: WeddingProject }> {
  try {
    const res = await fetch('/api/project/rsvp', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rsvp }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, newRSVP: data.newRSVP, project: data.project };
    }
  } catch (err) {
    console.error('Error submitting RSVP to database:', err);
  }
  return { success: false };
}

/**
 * Parses a 12-hour or 24-hour time string into hours and minutes
 */
export function parseTimeString(timeStr?: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 15, minutes: 30 };
  const clean = timeStr.trim();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return { hours: 15, minutes: 30 };
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const modifier = match[3]?.toLowerCase();

  if (modifier === 'pm' && hours < 12) {
    hours += 12;
  } else if (modifier === 'am' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
}

/**
 * Resolves accurate event date honoring user-customized formatted dates or ISO dates
 */
export function resolveEventDate(event: { date?: string; formattedDate?: string }): {
  year: string;
  month: string;
  day: string;
  dateStr: string;
  iso: string;
} {
  // If user customized the formatted display date (e.g., "Saturday, October 13, 2026")
  if (event.formattedDate) {
    const parsed = new Date(event.formattedDate);
    if (!isNaN(parsed.getTime())) {
      const year = String(parsed.getFullYear());
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return {
        year,
        month,
        day,
        dateStr: `${year}${month}${day}`,
        iso: `${year}-${month}-${day}`,
      };
    }
  }

  // Fallback to event.date if present
  if (event.date) {
    const clean = event.date.split('T')[0];
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return {
        year: match[1],
        month: match[2],
        day: match[3],
        dateStr: `${match[1]}${match[2]}${match[3]}`,
        iso: `${match[1]}-${match[2]}-${match[3]}`,
      };
    }
    const parsed = new Date(event.date);
    if (!isNaN(parsed.getTime())) {
      const year = String(parsed.getFullYear());
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return {
        year,
        month,
        day,
        dateStr: `${year}${month}${day}`,
        iso: `${year}-${month}-${day}`,
      };
    }
  }

  return {
    year: '2026',
    month: '10',
    day: '13',
    dateStr: '20261013',
    iso: '2026-10-13',
  };
}

/**
 * Generates an Add to Google Calendar URL for an event with accurate date & time
 */
export function generateGoogleCalendarUrl(event: WeddingEvent, coupleNames: string): string {
  const title = encodeURIComponent(`${event.name} - ${coupleNames}'s Wedding`);
  
  const { dateStr } = resolveEventDate(event);
  const startTime = parseTimeString(event.time);
  let endTime = parseTimeString(event.endTime);

  // If no end time or end time <= start time on same day, default to start time + 2 hours
  if (!event.endTime || (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes))) {
    endTime = { hours: Math.min(23, startTime.hours + 2), minutes: startTime.minutes };
  }

  const startHourFormatted = String(startTime.hours).padStart(2, '0');
  const startMinFormatted = String(startTime.minutes).padStart(2, '0');
  const endHourFormatted = String(endTime.hours).padStart(2, '0');
  const endMinFormatted = String(endTime.minutes).padStart(2, '0');

  const dates = `${dateStr}T${startHourFormatted}${startMinFormatted}00/${dateStr}T${endHourFormatted}${endMinFormatted}00`;
  
  const venueLocation = event.venue
    ? `${event.venue.name || ''}, ${event.venue.address || ''}, ${event.venue.cityStateZip || ''}`.replace(/^, |, $/g, '')
    : '';
  const location = encodeURIComponent(venueLocation || 'Wedding Venue');
  const details = encodeURIComponent(
    `${event.description || ''}\n\nDress Code: ${event.dressCode || 'Formal'}\nVenue Notes: ${event.venue?.parkingInfo || ''}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/**
 * Downloads .ics calendar file for an event with accurate date & time
 */
export function downloadICalendar(event: WeddingEvent, coupleNames: string): void {
  const title = `${event.name} - ${coupleNames}'s Wedding`;
  const venueLocation = event.venue
    ? `${event.venue.name || ''}, ${event.venue.address || ''}, ${event.venue.cityStateZip || ''}`.replace(/^, |, $/g, '')
    : '';
  const description = `${event.description || ''}\\nDress Code: ${event.dressCode || 'Formal'}\\nParking: ${event.venue?.parkingInfo || ''}`;
  
  const { dateStr } = resolveEventDate(event);
  const startTime = parseTimeString(event.time);
  let endTime = parseTimeString(event.endTime);

  if (!event.endTime || (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes))) {
    endTime = { hours: Math.min(23, startTime.hours + 2), minutes: startTime.minutes };
  }

  const startHour = String(startTime.hours).padStart(2, '0');
  const startMin = String(startTime.minutes).padStart(2, '0');
  const endHour = String(endTime.hours).padStart(2, '0');
  const endMin = String(endTime.minutes).padStart(2, '0');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation Portal//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `LOCATION:${venueLocation || 'Wedding Venue'}`,
    `DESCRIPTION:${description}`,
    `DTSTART:${dateStr}T${startHour}${startMin}00`,
    `DTEND:${dateStr}T${endHour}${endMin}00`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.name.toLowerCase().replace(/\s+/g, '-')}-invitation.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Upload a photo directly to SQLite and server storage
 */
export async function uploadPhotoToDB(payload: {
  dataUrl: string;
  albumId?: string;
  caption?: string;
  uploaderName?: string;
  uploaderType?: 'guest' | 'couple' | 'admin';
}): Promise<{ success: boolean; photo: WeddingPhoto; project: WeddingProject }> {
  const response = await fetch('/api/photos/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to upload photo');
  }
  return response.json();
}

/**
 * Create or update an album in SQLite
 */
export async function createAlbumInDB(payload: {
  id?: string;
  title: string;
  description?: string;
  coverPhotoUrl?: string;
  createdBy?: 'couple' | 'guest';
  uploaderName?: string;
}): Promise<{ success: boolean; album: PhotoAlbum; project: WeddingProject }> {
  const response = await fetch('/api/photos/album', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to save album');
  }
  return response.json();
}

/**
 * Delete an album from SQLite
 */
export async function deleteAlbumFromDB(albumId: string): Promise<{ success: boolean; project: WeddingProject }> {
  const response = await fetch(`/api/photos/album/${encodeURIComponent(albumId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete album');
  }
  return response.json();
}

/**
 * Delete a photo from SQLite
 */
export async function deletePhotoFromDB(photoId: string): Promise<{ success: boolean; project: WeddingProject }> {
  const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete photo');
  }
  return response.json();
}

/**
 * Like / heart a photo in SQLite
 */
export async function likePhotoInDB(photoId: string): Promise<{ success: boolean; photo: WeddingPhoto; project: WeddingProject }> {
  const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/like`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to like photo');
  }
  return response.json();
}

