import { WeddingProject, InvitationLink, SocialShareSettings, WeddingEvent } from '../types/wedding';

/**
 * Returns all assigned events for a given invitation link in presentation order.
 */
export function getLinkAssignedEvents(link: InvitationLink, project: WeddingProject): WeddingEvent[] {
  if (!project.events || !link.eventIds) return [];
  return project.events
    .filter((e) => link.eventIds.includes(e.id))
    .sort((a, b) => a.order - b.order);
}

/**
 * Extract human readable short date e.g. "10th Oct" or "11th Oct" from event dates
 */
export function formatShortDate(formattedDate?: string, isoDate?: string): string {
  if (formattedDate) {
    const match = formattedDate.match(/\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})/i);
    if (match) {
      const month = match[1].substring(0, 3);
      const day = parseInt(match[2], 10);
      const suffix = [1, 21, 31].includes(day) ? 'st' : [2, 22].includes(day) ? 'nd' : [3, 23].includes(day) ? 'rd' : 'th';
      return `${day}${suffix} ${month}`;
    }
  }
  if (isoDate) {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = monthNames[parseInt(parts[1], 10) - 1] || 'Oct';
      const d = parseInt(parts[2], 10);
      const suffix = [1, 21, 31].includes(d) ? 'st' : [2, 22].includes(d) ? 'nd' : [3, 23].includes(d) ? 'rd' : 'th';
      return `${d}${suffix} ${m}`;
    }
  }
  return '10th Oct';
}

/**
 * Automatically generates distinct, event-accurate default metadata tailored specifically
 * to an invitation link based on its assigned events, couple, dates, and venues.
 */
export function getEventDefaultSharePreview(link: InvitationLink, project: WeddingProject): SocialShareSettings {
  const events = getLinkAssignedEvents(link, project);
  const couple = project.couple?.formattedTitle || 'Iram & Tabish';
  const defaultDomain = project.sharePreview?.customDomain || 'wed.tabish.in';
  const defaultImage = project.sharePreview?.imageUrl || '/tabish_iram_card.jpg';

  // Case 1: Single Event (e.g. Ceremony only OR Reception only)
  if (events.length === 1) {
    const evt = events[0];
    const isReception = evt.type === 'reception' || evt.name.toLowerCase().includes('reception') || link.type === 'reception_only';
    const isCeremony = evt.type === 'wedding' || evt.name.toLowerCase().includes('ceremony') || evt.name.toLowerCase().includes('nikah') || link.type === 'wedding_only';

    let eventLabel = evt.name;
    if (isReception && !eventLabel.toLowerCase().includes('wedding')) {
      eventLabel = 'Wedding Reception';
    } else if (isCeremony && !eventLabel.toLowerCase().includes('wedding')) {
      eventLabel = 'Wedding Ceremony & Nikah';
    }

    const shortDate = formatShortDate(evt.formattedDate, evt.date);
    const title = `${eventLabel} of ${couple} | ${shortDate}`;
    
    const venueName = evt.venue?.name ? ` at ${evt.venue.name}` : '';
    const location = evt.venue?.cityStateZip ? ` - ${evt.venue.cityStateZip}` : '';
    const timeStr = evt.time ? ` from ${evt.time} onwards` : '';
    const dateStr = evt.formattedDate ? ` to be held on ${evt.formattedDate}` : '';

    const description = `With the divine grace of the almighty, inviting you and your family to our ${eventLabel.toLowerCase()}${dateStr}${venueName}${timeStr}.`;
    const cardSnippet = `${eventLabel}${venueName}${location ? ` (${location.replace(/^ - /, '')})` : ''}`;

    return {
      title,
      description,
      cardSnippet,
      imageUrl: defaultImage,
      customDomain: defaultDomain,
    };
  }

  // Case 2: Multi-Event (e.g. Wedding Ceremony + Evening Reception)
  if (events.length > 1) {
    const hasReception = events.some((e) => e.type === 'reception' || e.name.toLowerCase().includes('reception'));
    const hasCeremony = events.some((e) => e.type === 'wedding' || e.name.toLowerCase().includes('ceremony') || e.name.toLowerCase().includes('nikah'));

    let title = `Wedding & Reception of ${couple} | 10th & 11th Oct`;
    if (!hasReception || !hasCeremony) {
      title = `Wedding Celebrations of ${couple} | 10th & 11th Oct`;
    }

    const eventSummaries = events.map((e) => {
      const shortD = formatShortDate(e.formattedDate, e.date);
      return `${e.name} (${shortD} at ${e.venue?.name || 'Venue'})`;
    }).join(' & ');

    const description = `With the divine grace of the almighty, inviting you and your family to celebrate the wedding ceremonies of ${couple}: ${eventSummaries}.`;
    const cardSnippet = `Wedding Ceremony & Reception Celebrations of ${couple}`;

    return {
      title,
      description,
      cardSnippet,
      imageUrl: defaultImage,
      customDomain: defaultDomain,
    };
  }

  // Fallback for custom link with no events assigned
  return {
    title: `Wedding Invitation of ${couple} | 10th Oct`,
    description: `With the divine grace of the almighty, inviting you and your family to celebrate our wedding ceremonies.`,
    cardSnippet: `Wedding Celebration of ${couple}`,
    imageUrl: defaultImage,
    customDomain: defaultDomain,
  };
}

/**
 * Returns the effective, guaranteed distinct share metadata for a specific invitation link.
 * If the link has custom-saved sharePreview attributes, they are respected.
 * If custom attributes are missing or empty, event-specific dynamic metadata is computed.
 * It NEVER leaks or falls back to another link's metadata!
 */
export function getEffectiveShareMetadata(
  link: InvitationLink | null | undefined,
  project: WeddingProject
): SocialShareSettings {
  const couple = project.couple?.formattedTitle || 'Iram & Tabish';
  const defaultDomain = project.sharePreview?.customDomain || 'wed.tabish.in';
  const defaultImage = project.sharePreview?.imageUrl || '/tabish_iram_card.jpg';

  // If no link specified (general root domain share)
  if (!link) {
    return {
      title: (project.sharePreview?.title && !project.sharePreview.title.toLowerCase().includes('reception only'))
        ? project.sharePreview.title
        : `Wedding Celebration of ${couple} | 10th & 11th Oct`,
      description: project.sharePreview?.description || `With the divine grace of the almighty, inviting you and your family to celebrate our wedding ceremonies.`,
      cardSnippet: project.sharePreview?.cardSnippet || `Wedding Celebration of ${couple}`,
      imageUrl: project.sharePreview?.imageUrl || defaultImage,
      customDomain: project.sharePreview?.customDomain || defaultDomain,
    };
  }

  // Generate event-specific baseline for this link
  const generatedDefault = getEventDefaultSharePreview(link, project);

  // If the link has explicit custom saved metadata, merge cleanly with event defaults
  const custom = link.sharePreview;
  if (custom) {
    return {
      title: (custom.title && custom.title.trim()) ? custom.title.trim() : generatedDefault.title,
      description: (custom.description && custom.description.trim()) ? custom.description.trim() : generatedDefault.description,
      cardSnippet: (custom.cardSnippet && custom.cardSnippet.trim()) ? custom.cardSnippet.trim() : (custom.description || generatedDefault.cardSnippet),
      imageUrl: custom.imageUrl || generatedDefault.imageUrl,
      customDomain: custom.customDomain || generatedDefault.customDomain,
    };
  }

  return generatedDefault;
}

/**
 * Parse any incoming URL (path or query parameters) and resolve the corresponding InvitationLink.
 */
export function resolveLinkFromUrl(
  pathOrUrl: string,
  queryParams: Record<string, any> | URLSearchParams | undefined,
  invitationLinks: InvitationLink[] | undefined
): InvitationLink | null {
  if (!invitationLinks || invitationLinks.length === 0) return null;

  // 1. Extract candidate codes from query parameters (?invite=..., ?link=..., ?code=...)
  let queryCode = '';
  if (queryParams instanceof URLSearchParams) {
    queryCode = (queryParams.get('invite') || queryParams.get('link') || queryParams.get('code') || '').trim();
  } else if (queryParams && typeof queryParams === 'object') {
    queryCode = String(queryParams.invite || queryParams.link || queryParams.code || '').trim();
  }

  // 2. Extract candidate codes from path
  const cleanPath = (pathOrUrl || '').split('?')[0].replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/').filter(Boolean);
  let pathCode = '';

  if (segments.length > 0) {
    const firstSegment = segments[0].toLowerCase();
    if (['invite', 'link', 'wedding', 'event', 'guest'].includes(firstSegment) && segments.length > 1) {
      pathCode = segments[1].trim();
    } else if (segments.length === 1 && firstSegment !== 'api' && firstSegment !== 'admin' && !firstSegment.includes('.')) {
      pathCode = segments[0].trim();
    }
  }

  const candidateCodes = [queryCode, pathCode].filter(Boolean).map((c) => c.toLowerCase());

  if (candidateCodes.length === 0) {
    return null;
  }

  for (const candidate of candidateCodes) {
    const matched = invitationLinks.find((l) => {
      const code = (l.code || '').toLowerCase();
      const id = (l.id || '').toLowerCase();
      const type = (l.type || '').toLowerCase();
      
      if (code === candidate || id === candidate || type === candidate) return true;
      
      // Also match normalized variants (e.g. "1" matches "wedding-only" or "ceremony")
      if (candidate === '1' && (type === 'wedding_only' || code === '1' || code === 'wedding')) return true;
      if (candidate === '2' && (type === 'reception_only' || code === '2' || code === 'reception')) return true;
      if (candidate === '3' && (type === 'wedding_reception' || code === '3' || code === 'all' || code === 'full')) return true;
      
      if ((candidate === 'wedding-only' || candidate === 'ceremony') && (code === '1' || type === 'wedding_only')) return true;
      if ((candidate === 'reception-only' || candidate === 'reception') && (code === '2' || type === 'reception_only')) return true;
      if ((candidate === 'wedding-reception' || candidate === 'full') && (code === '3' || type === 'wedding_reception')) return true;

      return false;
    });

    if (matched) return matched;
  }

  return null;
}
