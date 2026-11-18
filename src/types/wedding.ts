export type InvitationType = 'wedding_only' | 'reception_only' | 'wedding_reception' | 'custom';

export type EventCategory = 
  | 'nikah'
  | 'walima'
  | 'mayun'
  | 'ceremony' 
  | 'reception' 
  | 'haldi' 
  | 'mehndi' 
  | 'sangeet' 
  | 'baraat' 
  | 'pheras' 
  | 'dinner' 
  | 'cocktail' 
  | 'party' 
  | 'cultural' 
  | 'brunch' 
  | 'welcome'
  | 'custom';

export interface VenueInfo {
  name: string;
  address: string;
  cityStateZip: string;
  mapsUrl?: string;
  parkingInfo?: string;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  venuePhone?: string;
}

export interface WeddingEvent {
  id: string;
  type: 'wedding' | 'reception' | 'custom';
  category: EventCategory;
  customCategoryLabel?: string; // Custom badge / ritual label editable by user e.g. "Sacred Nikah & Dua"
  icon?: string; // Custom emoji / icon selected by user e.g. "🌙", "💍", "🕊️", "✨", "🕌", "🍽️"
  name: string;
  subtitle?: string;
  date: string; // e.g. "2026-10-24" or display date
  formattedDate: string; // e.g. "Saturday, October 24, 2026"
  time: string; // e.g. "3:30 PM"
  endTime?: string; // e.g. "5:00 PM"
  venue: VenueInfo;
  dressCode?: string;
  description?: string;
  scheduleHighlights?: string[];
  order: number;
}

export interface InvitationLink {
  id: string;
  code: string; // slug in URL, e.g. "wedding-only", "reception-only", "wedding-reception"
  type: InvitationType;
  title: string;
  description: string;
  eventIds: string[]; // which events are visible to this link
  recipientName?: string; // e.g., "The Peterson Family" or "Alex & Guest"
  maxGuests?: number;
  tableNumber?: string;
  viewsCount: number;
  createdAt: string;
  badgeColor?: string;
  sharePreview?: SocialShareSettings; // Independent metadata per link/event
}

export interface RSVPResponse {
  id: string;
  linkCode: string;
  linkType: InvitationType;
  guestName: string;
  email: string;
  phone?: string;
  status: 'attending' | 'declined' | 'tentative';
  attendingEventIds: string[];
  guestCount: number;
  dietaryRequirements?: string;
  songRequest?: string;
  messageToCouple?: string;
  submittedAt: string;
}

export type ThemeCategory = 
  | 'classic' 
  | 'romantic' 
  | 'bohemian' 
  | 'modern' 
  | 'moody' 
  | 'floral' 
  | 'regal' 
  | 'vintage' 
  | 'destination'
  | 'minimalist'
  | 'festive'
  | 'door-opening';

export type DoorOpeningStyle =
  | 'rajput-haveli'          // Hindu - Royal Rajputana Haveli Carved Teak & Brass Studs (Rajput / Marwari)
  | 'south-temple-brass'     // Hindu - South Indian Temple Gopuram Brass Carved Doors (Brahmin / Chettiar / Telugu)
  | 'shekhawati-jharokha'    // Hindu - Shekhawati Turquoise Painted Lattice Jharokha Doors (Gujarati / Marwari / Jain)
  | 'vedic-sandalwood'       // Hindu - Vedic Sandalwood Sacred Toran Mandap Doors (Sanatani / Vedic Vivah)
  | 'rajbari-terracotta'     // Hindu - Bengali Rajbari Zamindar Terracotta & Teak Doors (Bengali Hindu)
  | 'mughal-jali'            // Muslim - Mughal Nawabi Arched Scalloped Jali Lattice Gates (Mughal / Lucknowi)
  | 'andalusian-mashrabiya'  // Muslim - Andalusian Moroccan Arabesque Geometric Gates (Arab / Middle Eastern)
  | 'kashmiri-walnut'        // Muslim - Kashmiri Carved Walnut Wood & Chinar Leaf Doors (Kashmiri)
  | 'nawabi-emerald-velvet'  // Muslim - Nawabi Royal Emerald Velvet & Gilded Brass Gates (Nawabi / Hyderabadi)
  | 'swarna-sun-crest'       // Royal Golden Sun-Crest Gate with Fluted Lantern Columns & Filigree Doors (Exact Image 1)
  | 'shahi-teakwood-haveli'  // Shahi Teakwood & Scalloped Stone Haveli Gate with 10 Brass Sunbursts & Floral Pillars (Exact Image 2)
  | 'ivory-wax-envelope'     // Saath Studio Style - Lucknowi Chikankari Blind-Embossed Wax-Sealed Envelope
  | 'zardozi-velvet-envelope'// Saath Studio Style - Maroon Velvet Gold Zardozi Envelope with Initial Seal
  | 'parda-velvet-curtains'; // Saath Studio Style - Royal Red Velvet Curtains Parting under Chandelier

export interface DoorOpeningConfig {
  style: DoorOpeningStyle;
  title: string;
  subtitle: string;
  culturalType: 'hindu' | 'muslim' | 'universal';
  archShape: 'scalloped-mughal' | 'pointed-arch' | 'rajasthani-jharokha' | 'temple-gopuram' | 'horseshoe-arabesque' | 'classic-arch' | 'terracotta-rajbari' | 'swarna-sun-arch' | 'carved-stone-scalloped';
  doorColorPrimary: string;
  doorColorSecondary: string;
  goldTrimColor: string;
  knockerType: 'lion-ring' | 'peacock' | 'lotus' | 'sun-crest' | 'mughal-ring' | 'crescent-star' | 'floral-ring' | 'vertical-gold-handles' | 'brass-sunburst-plate';
  toranOrGarland?: 'marigold' | 'jasmine' | 'mango-leaves' | 'olive-leaves' | 'floral-pillar-garlands' | 'none';
  motifs: string[]; // e.g. ['elephant', 'lotus', 'peacock'] or ['arabesque', 'crescent', 'geometric']
}

export type BirdAnimationType = 'white-doves' | 'royal-parrots' | 'golden-cranes' | 'golden-sparrows' | 'flying-birds' | 'none';

export interface ThemeColors {
  primary: string; // main accent color
  primaryText: string; // text on primary buttons
  secondary: string;
  background: string; // main page background
  backgroundGradient: string; // CSS background style
  cardBg: string; // invitation card surface
  cardBorder: string; // card border
  textHeading: string; // heading color
  textBody: string; // body text color
  textMuted: string; // subtle text
  accent: string; // highlight tone
  goldOrMetallic: string; // decorative filigree/border tone
  badgeBg: string;
  badgeText: string;
  glowEffect?: string;
}

export interface WeddingTheme {
  id: string;
  name: string;
  tagline: string;
  category: ThemeCategory;
  isLiveAnimated?: boolean;
  liveAnimationLabel?: string;
  hasDoorOpening?: boolean;
  hasScratchToReveal?: boolean;
  doorOpeningConfig?: DoorOpeningConfig;
  birdAnimation?: BirdAnimationType;
  fontFamily: {
    heading: string;
    script: string;
    body: string;
  };
  colors: ThemeColors;
  decorations: {
    frameStyle: 'gold-double' | 'minimal-modern' | 'botanical-filigree' | 'vintage-lace' | 'arch-clean' | 'art-deco' | 'moroccan-star' | 'celestial-orb' | 'soft-rounded' | 'indian-mandap' | 'royal-jharokha';
    particleType: 'petals' | 'marigold-petals' | 'lilac-petals' | 'botanical-leaves' | 'sparkle-rain' | 'sparkles' | 'stars' | 'leaves' | 'champagne-bubbles' | 'snowflakes' | 'geometric' | 'flying-birds' | 'white-doves' | 'royal-parrots' | 'golden-cranes' | 'birds-and-petals' | 'none';
    cardShadow: string;
    sealEmoji: string;
    sealColor: string;
    ornamentType: 'floral-flourish' | 'golden-rings' | 'geometric-lines' | 'stars' | 'minimal-divider' | 'botanical-wreath' | 'classic-crest' | 'heart-knot' | 'lotus-mandala' | 'peacock-feather' | 'marigold-garland';
  };
  previewGradient: string;
}

export type LanguageScript = 'english' | 'urdu' | 'hindi' | 'arabic' | 'custom';

export interface TypographySettings {
  languageScript: LanguageScript;
  headingFont: string;
  scriptFont: string;
  bodyFont: string;
  auspiciousInvocation?: string; // e.g., "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" or "॥ श्री गणेशाय नमः ॥"
  isRTL?: boolean;
  customFontUrl?: string;
}

export interface SocialShareSettings {
  title: string; // Bold header in WhatsApp / social share previews, e.g. "Wedding Invitation of Iram & Tabish | 10th Oct"
  description: string; // Full description e.g. "With the divine grace of the almighty, inviting you and your family to our wedding to be held on 11th October at Jogale Banquet from 6:00 PM onwards."
  cardSnippet?: string; // Short snippet optimized for WhatsApp's 1-line link card preview box
  imageUrl?: string; // Uploaded image URL or image path
  customDomain?: string; // Displayed link / domain e.g. "wed.tabish.in"
}

export interface WeddingProject {
  id: string;
  couple: {
    partner1: string;
    partner2: string;
    fullName1?: string;
    fullName2?: string;
    formattedTitle: string; // "Eleanor & James"
  };
  announcementTitle: string; // "Together with their families"
  tagline: string; // "Request the pleasure of your company on their wedding day"
  loveStory?: string;
  weddingDate: string; // ISO date "2026-10-24"
  weddingDateFormatted: string; // "October 24, 2026"
  rsvpDeadlineFormatted: string; // "September 30, 2026"
  coverImage?: string;
  selectedThemeId: string;
  typography?: TypographySettings;
  audioTrack: {
    enabled: boolean;
    title: string;
    artist: string;
    url: string;
  };
  contact: {
    email: string;
    phone: string;
    weddingHashtag: string;
  };
  sharePreview?: SocialShareSettings; // OpenGraph & WhatsApp link preview card configuration
  showGiftRegistry?: boolean; // toggle visibility of Gift Registry on invitation
  showWishes?: boolean; // toggle visibility of Wishes & Blessings wall on invitation
  showRsvp?: boolean; // toggle visibility of RSVP system, button, and 'Kindly Respond' block
  showPhotosSection?: boolean; // toggle visibility of Photos & Albums gallery section
  allowGuestPhotoUploads?: boolean; // toggle whether invited guests can upload photos (if false, only admin can upload)
  maxGuestsPerRsvp?: number; // max party size / guests allowed per RSVP response
  enableDoorOpening?: boolean; // toggle 3D royal door opening entrance experience
  enableScratchToReveal?: boolean; // toggle interactive scratch-to-reveal save-the-date card
  giftRegistryUrl?: string;
  events: WeddingEvent[];
  invitationLinks: InvitationLink[];
  rsvps: RSVPResponse[];
  albums?: PhotoAlbum[];
  photos?: WeddingPhoto[];
  updatedAt?: string;
  version?: number;
}

export interface PhotoAlbum {
  id: string;
  title: string;
  description?: string;
  coverPhotoUrl?: string;
  createdAt: string;
  order: number;
  createdBy?: 'couple' | 'guest';
  uploaderName?: string;
  isDefault?: boolean; // true if this is one of the initial pre-created core celebration albums (cannot be deleted)
}

export interface WeddingPhoto {
  id: string;
  albumId: string;
  url: string;
  caption?: string;
  uploaderName: string;
  uploaderType: 'guest' | 'couple' | 'admin';
  uploadedAt: string;
  likesCount?: number;
  eventId?: string;
}

