import { LanguageScript } from '../types/wedding';

export interface FontOption {
  id: string;
  name: string;
  nativeLabel: string;
  cssFamily: string;
  category: 'urdu' | 'hindi' | 'arabic' | 'english' | 'custom';
  sampleHeading: string;
  sampleScript: string;
  recommendedRole: 'heading' | 'script' | 'body' | 'all';
}

export interface InvocationPreset {
  id: string;
  language: LanguageScript;
  label: string;
  text: string;
  subtext?: string;
  fontFamily?: string;
}

/**
 * Dynamically loads a Google Font by name into the document head
 */
export function loadGoogleFont(fontFamilyString: string): void {
  if (typeof document === 'undefined' || !fontFamilyString) return;

  // Extract first font name from comma-separated list and strip quotes
  const firstFont = fontFamilyString.split(',')[0].replace(/['"]/g, '').trim();
  if (!firstFont) return;

  // Avoid generic fallbacks
  const genericFallbacks = ['serif', 'sans-serif', 'cursive', 'monospace', 'fantasy', 'system-ui', 'georgia', 'arial', 'times new roman', 'helvetica'];
  if (genericFallbacks.includes(firstFont.toLowerCase())) return;

  const encodedName = encodeURIComponent(firstFont).replace(/%20/g, '+');
  const linkId = `google-font-dyn-${firstFont.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:ital,wght@0,300..900;1,300..900&display=swap`;
    document.head.appendChild(link);
  }
}

/**
 * Dynamically loads a custom external font stylesheet URL
 */
export function loadCustomFontStylesheet(url: string): void {
  if (typeof document === 'undefined' || !url || !url.startsWith('http')) return;
  const linkId = `custom-font-stylesheet-${encodeURIComponent(url).slice(-20)}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}

export const SUPPORTED_FONTS: FontOption[] = [
  // Urdu Fonts
  {
    id: 'noto-nastaliq-urdu',
    name: 'Noto Nastaliq Urdu',
    nativeLabel: 'نوستعلیق اردو',
    cssFamily: "'Noto Nastaliq Urdu', serif",
    category: 'urdu',
    sampleHeading: 'بسم اللہ الرحمٰن الرحیم',
    sampleScript: 'دعوتِ ولیمہ و نکاح',
    recommendedRole: 'heading',
  },
  {
    id: 'gulzar',
    name: 'Gulzar (Urdu Calligraphy)',
    nativeLabel: 'گلزار',
    cssFamily: "'Gulzar', serif",
    category: 'urdu',
    sampleHeading: 'شادی مبارک',
    sampleScript: 'گر قبول افتد زہے عز و شرف',
    recommendedRole: 'script',
  },
  {
    id: 'amiri-urdu',
    name: 'Amiri (Urdu & Arabic)',
    nativeLabel: 'امیری',
    cssFamily: "'Amiri', serif",
    category: 'urdu',
    sampleHeading: 'جشنِ مسرت',
    sampleScript: 'بزمِ نکاح',
    recommendedRole: 'all',
  },

  // Hindi Devanagari Fonts
  {
    id: 'rozha-one',
    name: 'Rozha One (Devanagari Headline)',
    nativeLabel: 'रोझा वन',
    cssFamily: "'Rozha One', serif",
    category: 'hindi',
    sampleHeading: '॥ श्री गणेशाय नमः ॥',
    sampleScript: 'शुभ विवाह व प्रीतिभोज',
    recommendedRole: 'heading',
  },
  {
    id: 'yatra-one-hindi',
    name: 'Yatra One (Traditional Devanagari)',
    nativeLabel: 'यात्रा वन',
    cssFamily: "'Yatra One', cursive",
    category: 'hindi',
    sampleHeading: '॥ सहजीवनाची सुंदर शुरुआत ॥',
    sampleScript: 'मंगल परिणय',
    recommendedRole: 'heading',
  },
  {
    id: 'noto-serif-devanagari',
    name: 'Noto Serif Devanagari',
    nativeLabel: 'नोटो सेरिफ देवनागरी',
    cssFamily: "'Noto Serif Devanagari', serif",
    category: 'hindi',
    sampleHeading: 'स्नेह निमंत्रण',
    sampleScript: 'विवाह संस्कार',
    recommendedRole: 'all',
  },
  {
    id: 'tiro-devanagari-hindi',
    name: 'Tiro Devanagari Hindi',
    nativeLabel: 'टिरो देवनागरी हिंदी',
    cssFamily: "'Tiro Devanagari Hindi', serif",
    category: 'hindi',
    sampleHeading: '॥ ॐ श्री लक्ष्मीनारायणाभ्यां नमः ॥',
    sampleScript: 'सांस्कृतिक विवाह',
    recommendedRole: 'body',
  },
  {
    id: 'poppins-devanagari',
    name: 'Poppins (Modern Clean Hindi)',
    nativeLabel: 'पॉपिन्स',
    cssFamily: "'Poppins', sans-serif",
    category: 'hindi',
    sampleHeading: 'शुभ विवाह',
    sampleScript: 'हल्दी, संगीत एवं फेरे',
    recommendedRole: 'body',
  },

  // Arabic Fonts
  {
    id: 'amiri-arabic',
    name: 'Amiri Quranic Naskh',
    nativeLabel: 'خط أميري كلاسيكي',
    cssFamily: "'Amiri', serif",
    category: 'arabic',
    sampleHeading: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    sampleScript: 'بارك الله لكما وبارك عليكما',
    recommendedRole: 'heading',
  },
  {
    id: 'aref-ruqaa',
    name: 'Aref Ruqaa (Arabic Calligraphy)',
    nativeLabel: 'خط رقعة عربي',
    cssFamily: "'Aref Ruqaa', cursive",
    category: 'arabic',
    sampleHeading: 'دعوة زفاف مبارك',
    sampleScript: 'وجعل بينكم مودة ورحمة',
    recommendedRole: 'script',
  },
  {
    id: 'cairo',
    name: 'Cairo (Modern Arabic Sans)',
    nativeLabel: 'خط كايرو الحديث',
    cssFamily: "'Cairo', sans-serif",
    category: 'arabic',
    sampleHeading: 'حفل الزفاف والبهجة',
    sampleScript: 'يسرنا دعوتكم لمشاركتنا الفرحة',
    recommendedRole: 'body',
  },
  {
    id: 'noto-naskh-arabic',
    name: 'Noto Naskh Arabic',
    nativeLabel: 'نوتو نسخ عربي',
    cssFamily: "'Noto Naskh Arabic', serif",
    category: 'arabic',
    sampleHeading: 'أفراح العائلتين الكريمتين',
    sampleScript: 'حياكم الله وأهلاً بكم',
    recommendedRole: 'all',
  },
  {
    id: 'scheherazade-new',
    name: 'Scheherazade New',
    nativeLabel: 'شهرزاد',
    cssFamily: "'Scheherazade New', serif",
    category: 'arabic',
    sampleHeading: 'بسم الله ما شاء الله',
    sampleScript: 'ليلة العمر والوفاق',
    recommendedRole: 'heading',
  },

  // English Classical Fonts
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    nativeLabel: 'Playfair Display',
    cssFamily: "'Playfair Display', Georgia, serif",
    category: 'english',
    sampleHeading: 'Together With Their Families',
    sampleScript: 'Sophia & Alexander',
    recommendedRole: 'heading',
  },
  {
    id: 'great-vibes',
    name: 'Great Vibes (Calligraphy)',
    nativeLabel: 'Great Vibes Calligraphy',
    cssFamily: "'Great Vibes', cursive",
    category: 'english',
    sampleHeading: 'Celebrating Love',
    sampleScript: 'The Nuptial Ceremony',
    recommendedRole: 'script',
  },
  {
    id: 'cinzel',
    name: 'Cinzel (Imperial Roman)',
    nativeLabel: 'Cinzel Imperial',
    cssFamily: "'Cinzel', serif",
    category: 'english',
    sampleHeading: 'Sacred Vows & Reception',
    sampleScript: 'Honor of Your Presence',
    recommendedRole: 'heading',
  },
  {
    id: 'alex-brush',
    name: 'Alex Brush (Script)',
    nativeLabel: 'Alex Brush',
    cssFamily: "'Alex Brush', cursive",
    category: 'english',
    sampleHeading: 'Wedding Celebration',
    sampleScript: 'Eternally Yours',
    recommendedRole: 'script',
  },
  {
    id: 'cormorant-garamond',
    name: 'Cormorant Garamond',
    nativeLabel: 'Cormorant Garamond',
    cssFamily: "'Cormorant Garamond', serif",
    category: 'english',
    sampleHeading: 'Request The Pleasure of Your Company',
    sampleScript: 'Evening Dinner & Gala',
    recommendedRole: 'body',
  },
  {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans (Clean Modern)',
    nativeLabel: 'Plus Jakarta Sans',
    cssFamily: "'Plus Jakarta Sans', sans-serif",
    category: 'english',
    sampleHeading: 'Wedding Program',
    sampleScript: 'Timeline & Directions',
    recommendedRole: 'body',
  },

  // Popular Custom & Luxury Fonts
  {
    id: 'cinzel-decorative',
    name: 'Cinzel Decorative (Luxury Roman)',
    nativeLabel: 'Cinzel Decorative',
    cssFamily: "'Cinzel Decorative', serif",
    category: 'custom',
    sampleHeading: 'ROYAL CELEBRATION',
    sampleScript: 'The Grand Nuptial Gala',
    recommendedRole: 'heading',
  },
  {
    id: 'allura',
    name: 'Allura (Flowing Ribbon Script)',
    nativeLabel: 'Allura Script',
    cssFamily: "'Allura', cursive",
    category: 'custom',
    sampleHeading: 'Together in Love',
    sampleScript: 'Sophia and Alexander',
    recommendedRole: 'script',
  },
  {
    id: 'pinyon-script',
    name: 'Pinyon Script (Vintage Ballroom)',
    nativeLabel: 'Pinyon Script',
    cssFamily: "'Pinyon Script', cursive",
    category: 'custom',
    sampleHeading: 'The Matrimony Of',
    sampleScript: 'Honor of your presence',
    recommendedRole: 'script',
  },
  {
    id: 'parisienne',
    name: 'Parisienne (French Romantic Script)',
    nativeLabel: 'Parisienne',
    cssFamily: "'Parisienne', cursive",
    category: 'custom',
    sampleHeading: 'Une Belle Histoire',
    sampleScript: 'Forever and Always',
    recommendedRole: 'script',
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script (Playful Elegance)',
    nativeLabel: 'Dancing Script',
    cssFamily: "'Dancing Script', cursive",
    category: 'custom',
    sampleHeading: 'Save Our Date',
    sampleScript: 'Join Us for Dinner and Dancing',
    recommendedRole: 'script',
  },
  {
    id: 'marcellus',
    name: 'Marcellus (Sculpted Classical)',
    nativeLabel: 'Marcellus',
    cssFamily: "'Marcellus', serif",
    category: 'custom',
    sampleHeading: 'TWO HEARTS ONE JOURNEY',
    sampleScript: 'Sacred Vows & Festivities',
    recommendedRole: 'heading',
  },
  {
    id: 'bodoni-moda',
    name: 'Bodoni Moda (High Fashion Serif)',
    nativeLabel: 'Bodoni Moda',
    cssFamily: "'Bodoni Moda', serif",
    category: 'custom',
    sampleHeading: 'NUPTIAL CELEBRATION',
    sampleScript: 'Cocktails, Dinner & Dancing',
    recommendedRole: 'heading',
  },
  {
    id: 'prata',
    name: 'Prata (Teardrop Serif)',
    nativeLabel: 'Prata',
    cssFamily: "'Prata', serif",
    category: 'custom',
    sampleHeading: 'The Wedding Ceremony',
    sampleScript: 'A Joyous Occasion',
    recommendedRole: 'heading',
  },
  {
    id: 'montserrat',
    name: 'Montserrat (Modern Editorial Sans)',
    nativeLabel: 'Montserrat',
    cssFamily: "'Montserrat', sans-serif",
    category: 'custom',
    sampleHeading: 'WELCOME TO OUR WEDDING',
    sampleScript: 'Everything you need to know',
    recommendedRole: 'body',
  },
  {
    id: 'tangerine',
    name: 'Tangerine (Graceful Calligraphy)',
    nativeLabel: 'Tangerine',
    cssFamily: "'Tangerine', cursive",
    category: 'custom',
    sampleHeading: 'With Joyful Hearts',
    sampleScript: 'Requesting the honor of your presence',
    recommendedRole: 'script',
  },
  {
    id: 'italianno',
    name: 'Italianno (Flourished Signature)',
    nativeLabel: 'Italianno',
    cssFamily: "'Italianno', cursive",
    category: 'custom',
    sampleHeading: 'Happily Ever After',
    sampleScript: 'Celebrate with Us',
    recommendedRole: 'script',
  },
  {
    id: 'sacramento',
    name: 'Sacramento (Monoline Script)',
    nativeLabel: 'Sacramento',
    cssFamily: "'Sacramento', cursive",
    category: 'custom',
    sampleHeading: 'Forever Begins Today',
    sampleScript: 'Love never fails',
    recommendedRole: 'script',
  },
];

export const INVOCATION_PRESETS: InvocationPreset[] = [
  // Urdu / Islamic Presets
  {
    id: 'bismillah-urdu',
    language: 'urdu',
    label: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (Bismillah)',
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    subtext: 'In the name of Allah, the Most Gracious, the Most Merciful',
    fontFamily: "'Noto Nastaliq Urdu', serif",
  },
  {
    id: 'barakallah-urdu',
    language: 'urdu',
    label: 'بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا (Barakallah)',
    text: 'بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
    subtext: 'May Allah bless you and shower His blessings upon you',
    fontFamily: "'Noto Nastaliq Urdu', serif",
  },
  {
    id: 'gar-qabool-urdu',
    language: 'urdu',
    label: 'گر قبول افتد زہے عز و شرف (Nuptial Verse)',
    text: 'گر قبول افتد زہے عز و شرف',
    subtext: 'Traditional Urdu royal wedding couplet',
    fontFamily: "'Gulzar', serif",
  },

  // Hindi Presets
  {
    id: 'ganeshay-namah-hindi',
    language: 'hindi',
    label: '॥ श्री गणेशाय नमः ॥ (Shree Ganesh Invocation)',
    text: '॥ श्री गणेशाय नमः ॥',
    subtext: 'Auspicious invocation to Lord Ganesha for auspicious beginnings',
    fontFamily: "'Rozha One', serif",
  },
  {
    id: 'shubh-vivah-hindi',
    language: 'hindi',
    label: '॥ शुभ विवाह ॥ (Shubh Vivah)',
    text: '॥ शुभ विवाह ॥',
    subtext: 'Auspicious Union & Sacred Marriage',
    fontFamily: "'Rozha One', serif",
  },
  {
    id: 'vakratunda-hindi',
    language: 'hindi',
    label: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ (Ganesh Shloka)',
    text: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    subtext: 'Prayer for removing all obstacles on this sacred occasion',
    fontFamily: "'Noto Serif Devanagari', serif",
  },

  // Arabic Presets
  {
    id: 'bismillah-arabic',
    language: 'arabic',
    label: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (Arabic Bismillah)',
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    subtext: 'In the name of God, Most Compassionate, Ever-Merciful',
    fontFamily: "'Amiri', serif",
  },
  {
    id: 'surah-rum-arabic',
    language: 'arabic',
    label: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا (Surah Rum 21)',
    text: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
    subtext: 'And among His signs is that He created for you spouses...',
    fontFamily: "'Amiri', serif",
  },
  {
    id: 'alf-mabrook-arabic',
    language: 'arabic',
    label: 'ألف مبروك وبالرفاه والبنين (Congratulations)',
    text: 'ألف مبروك للعروسين وبالرفاه والبنين',
    subtext: 'May your union be filled with perpetual joy and harmony',
    fontFamily: "'Aref Ruqaa', cursive",
  },

  // English & Custom Presets
  {
    id: 'together-families-english',
    language: 'english',
    label: 'Together with their families',
    text: 'Together with their families',
    subtext: 'Classic timeless announcement',
    fontFamily: "'Playfair Display', serif",
  },
  {
    id: 'in-name-of-love',
    language: 'english',
    label: 'In the name of love and new beginnings',
    text: 'In the name of love, faith, and joy',
    subtext: 'Modern romantic blessing',
    fontFamily: "'Cormorant Garamond', serif",
  },
  {
    id: 'custom-auspicious-blessing',
    language: 'custom',
    label: 'Custom Auspicious Invocation',
    text: 'Celebrating the union of two souls and families',
    subtext: 'Universal celebration blessing',
    fontFamily: "'Cinzel Decorative', serif",
  },
];
