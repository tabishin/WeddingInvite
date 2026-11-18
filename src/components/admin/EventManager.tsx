import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Car, 
  Shirt, 
  Sparkles, 
  Navigation,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Smile
} from 'lucide-react';
import { WeddingEvent, WeddingProject, EventCategory } from '../../types/wedding';
import { saveWeddingProject } from '../../services/storage';

interface EventManagerProps {
  project: WeddingProject;
  onProjectUpdated: (project: WeddingProject) => void;
}

export const EventManager: React.FC<EventManagerProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newScheduleItem, setNewScheduleItem] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<WeddingEvent>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getResolvedBadge = (evt: Partial<WeddingEvent>) => {
    const customLabel = evt.customCategoryLabel?.trim();
    const customIcon = evt.icon?.trim();

    let defaultLabel = 'Sacred Ceremony';
    let defaultIcon = '💍';

    switch (evt.category) {
      case 'nikah':
        defaultLabel = 'Sacred Nikah Ceremony';
        defaultIcon = '🌙';
        break;
      case 'walima':
        defaultLabel = 'Walima Banquet';
        defaultIcon = '🍽️';
        break;
      case 'mayun':
        defaultLabel = 'Mayun & Ubtan Ritual';
        defaultIcon = '🟡';
        break;
      case 'haldi':
        defaultLabel = 'Haldi Ceremony';
        defaultIcon = '🟡';
        break;
      case 'mehndi':
        defaultLabel = 'Mehndi Celebration';
        defaultIcon = '🌿';
        break;
      case 'sangeet':
        defaultLabel = 'Sangeet & Dance';
        defaultIcon = '🪩';
        break;
      case 'baraat':
        defaultLabel = 'Royal Baraat';
        defaultIcon = '🐎';
        break;
      case 'pheras':
        defaultLabel = 'Sacred Ceremony & Vows';
        defaultIcon = '💍';
        break;
      case 'dinner':
        defaultLabel = 'Celebration Dinner';
        defaultIcon = '🍽️';
        break;
      case 'cocktail':
        defaultLabel = 'Welcome Social Hour';
        defaultIcon = '✨';
        break;
      case 'brunch':
        defaultLabel = 'Farewell Brunch';
        defaultIcon = '🥞';
        break;
      case 'reception':
        defaultLabel = 'The Evening Reception';
        defaultIcon = '🍽️';
        break;
      case 'ceremony':
        defaultLabel = 'The Wedding Ceremony';
        defaultIcon = '💍';
        break;
      default:
        if (evt.type === 'wedding') {
          defaultLabel = 'The Wedding Ceremony';
          defaultIcon = '💍';
        } else if (evt.type === 'reception') {
          defaultLabel = 'The Evening Reception';
          defaultIcon = '🍽️';
        } else {
          defaultLabel = evt.name || 'Special Celebration';
          defaultIcon = '✨';
        }
        break;
    }

    return {
      label: customLabel || defaultLabel,
      icon: customIcon || defaultIcon,
    };
  };

  const handleStartCreate = (preset?: 'nikah' | 'walima' | 'mayun' | 'ceremony' | 'reception' | 'cocktail' | 'haldi' | 'mehndi' | 'sangeet' | 'baraat' | 'pheras') => {
    const defaultDate = project.weddingDate ? project.weddingDate.split('T')[0] : '2026-10-13';
    let initial: Partial<WeddingEvent> = {
      id: 'event-' + Date.now(),
      type: 'custom',
      category: 'ceremony',
      customCategoryLabel: 'Sacred Ceremony',
      icon: '💍',
      name: 'New Celebration Event',
      subtitle: '',
      date: defaultDate,
      formattedDate: project.weddingDateFormatted || 'Saturday, October 13, 2026',
      time: '4:00 PM',
      endTime: '6:00 PM',
      venue: {
        name: 'The Glass Pavilion & Courtyard',
        address: '120 Vineyard Road',
        cityStateZip: 'Napa Valley, CA 94558',
        mapsUrl: 'https://maps.google.com/?q=Napa+Valley',
        parkingInfo: 'Complimentary on-site valet & parking',
        indoorOutdoor: 'indoor',
      },
      dressCode: 'Festive & Elegant',
      description: 'Join us for this joyous celebration as we bring our families together in love and harmony.',
      scheduleHighlights: ['Guest Arrival & Refreshments', 'Main Rituals & Blessings', 'Feast & Festivities'],
      order: project.events.length + 1,
    };

    if (preset === 'nikah') {
      initial.type = 'wedding';
      initial.category = 'nikah';
      initial.customCategoryLabel = 'Sacred Nikah Ceremony';
      initial.icon = '🌙';
      initial.name = 'Sacred Nikah Ceremony';
      initial.subtitle = 'Solemnization of marriage, sacred vows, and prayers for eternal union';
      initial.time = '6:00 PM';
      initial.endTime = '9:00 PM';
      initial.dressCode = 'Modest Traditional / Festive Elegance';
      initial.venue!.name = 'Grand Palace Hall';
      initial.venue!.address = '100 Royal Crescent';
      initial.venue!.cityStateZip = 'Mumbai, Maharashtra';
      initial.description = 'Join us as we unite our lives under divine blessings. Your presence and duas are requested on this joyous milestone.';
      initial.scheduleHighlights = [
        '6:00 PM - Welcome Reception & Refreshments',
        '6:45 PM - Recitation of Holy Quran & Khutbah',
        '7:15 PM - Solemn Nikah Signing & Ijab-e-Qubool',
        '8:00 PM - Heartfelt Dua & Family Greetings',
        '8:30 PM - Royal Festive Feast'
      ];
    } else if (preset === 'walima') {
      initial.type = 'reception';
      initial.category = 'walima';
      initial.customCategoryLabel = 'Walima Banquet';
      initial.icon = '🍽️';
      initial.name = 'Grand Walima Banquet';
      initial.subtitle = 'Dinner banquet, heartfelt prayers, and joyful celebration';
      initial.time = '7:30 PM';
      initial.endTime = '11:00 PM';
      initial.dressCode = 'Formal Evening / Traditional Glamour';
      initial.venue!.name = 'The Crystal Ballroom';
      initial.venue!.address = '200 Heritage Boulevard';
      initial.venue!.cityStateZip = 'Mumbai, Maharashtra';
      initial.description = 'Celebrate our newly married life with an exquisite evening of feast, warm blessings, and memories with beloved family and friends.';
      initial.scheduleHighlights = [
        '7:30 PM - Guest Welcoming & Welcome Drinks',
        '8:30 PM - Grand Couple Entrance & Stage Greetings',
        '9:00 PM - Sumptuous Dinner Feast & Delicacies',
        '10:15 PM - Photography & Farewell Wishes'
      ];
    } else if (preset === 'mayun') {
      initial.type = 'custom';
      initial.category = 'mayun';
      initial.customCategoryLabel = 'Mayun & Ubtan Ceremony';
      initial.icon = '🟡';
      initial.name = 'Mayun & Ubtan Ritual';
      initial.subtitle = 'Traditional ubtan application, floral adornments & festive songs';
      initial.time = '4:00 PM';
      initial.endTime = '7:00 PM';
      initial.dressCode = 'Sunny Yellows & Vibrant Pastels';
      initial.venue!.name = 'Sunflower Courtyard';
      initial.description = 'A delightful traditional ceremony filled with fragrant ubtan paste, yellow marigolds, singing, and joy.';
      initial.scheduleHighlights = [
        '4:00 PM - Floral Welcome & Tea',
        '4:45 PM - Traditional Ubtan Ritual & Blessings',
        '6:00 PM - Festive High Tea & Snacks'
      ];
    } else if (preset === 'haldi') {
      initial.type = 'custom';
      initial.category = 'haldi';
      initial.customCategoryLabel = 'Haldi Ceremony';
      initial.icon = '🟡';
      initial.name = 'Auspicious Haldi Ceremony';
      initial.subtitle = 'Turmeric application, floral showers & joyous blessings';
      initial.time = '10:30 AM';
      initial.endTime = '1:30 PM';
      initial.dressCode = 'Sunny Yellow & Traditional Saffron Attire';
      initial.venue!.name = 'Sunflower Sunlit Courtyard';
      initial.description = 'Join us for the vibrant Haldi ritual where fragrant turmeric paste and fresh marigold flower petals are showered upon the couple with blessings and laughter.';
      initial.scheduleHighlights = ['10:30 AM - Haldi Kholna & Welcome Drinks', '11:15 AM - Floral Haldi & Phoolon Ki Holi', '12:30 PM - Traditional Festive Brunch'];
    } else if (preset === 'mehndi') {
      initial.type = 'custom';
      initial.category = 'mehndi';
      initial.customCategoryLabel = 'Mehndi Celebration';
      initial.icon = '🌿';
      initial.name = 'Henna & Mehndi Celebration';
      initial.subtitle = 'Intricate henna art, folk songs, dholak beats & delicacies';
      initial.time = '4:00 PM';
      initial.endTime = '8:00 PM';
      initial.dressCode = 'Emerald Green, Teal, or Bohemian Pastels';
      initial.venue!.name = 'The Royal Heritage Lawns';
      initial.description = 'An afternoon of intricate henna stain artistry, live dhol players, bangles corner, and delightful street food stations.';
      initial.scheduleHighlights = ['4:00 PM - Henna Artists & High Tea', '5:30 PM - Live Dholak & Folk Anthems', '7:00 PM - Twilight Dinner Under the Stars'];
    } else if (preset === 'sangeet') {
      initial.type = 'custom';
      initial.category = 'sangeet';
      initial.customCategoryLabel = 'Sangeet & Dance';
      initial.icon = '🪩';
      initial.name = 'Grand Sangeet & Musical Night';
      initial.subtitle = 'Choreographed dances, musical showdown & music celebration';
      initial.time = '7:00 PM';
      initial.endTime = '12:00 AM';
      initial.dressCode = 'Glamorous Indo-Western & Shimmering Outfits';
      initial.venue!.name = 'Crystal Ballroom & Stage';
      initial.description = 'Get ready to cheer and dance! A high-octane evening of family dance performances, celebratory toasts, and dancing into the midnight hours.';
      initial.scheduleHighlights = ['7:00 PM - Red Carpet & Welcome Drinks', '8:15 PM - Family Dance Showcase & Skits', '9:30 PM - Grand Dinner & Music Celebration'];
    } else if (preset === 'baraat') {
      initial.type = 'custom';
      initial.category = 'baraat';
      initial.customCategoryLabel = 'Royal Baraat';
      initial.icon = '🐎';
      initial.name = 'Royal Baraat Procession';
      initial.subtitle = 'Dholak beats, celebratory procession & Milni welcoming';
      initial.time = '3:00 PM';
      initial.endTime = '4:30 PM';
      initial.dressCode = 'Royal Traditional with Turbans / Safas';
      initial.venue!.name = 'Palace Grand Entrance Promenade';
      initial.description = 'The groom and family arrive in grand style with lively brass bands and dhols, greeted by the bride’s family in the ceremonial Milni.';
      initial.scheduleHighlights = ['3:00 PM - Safa Tying & Procession Assemble', '3:30 PM - Procession Down Palace Drive', '4:15 PM - Traditional Milni & Garland Welcome'];
    } else if (preset === 'pheras' || preset === 'ceremony') {
      initial.type = 'wedding';
      initial.category = preset === 'pheras' ? 'pheras' : 'ceremony';
      initial.customCategoryLabel = preset === 'pheras' ? 'Sacred Ceremony & Vows' : 'Sacred Wedding Ceremony';
      initial.icon = '💍';
      initial.name = preset === 'pheras' ? 'Sacred Ceremony & Wedding Vows' : 'Sacred Wedding Ceremony';
      initial.subtitle = 'The exchange of vows, rings, and lifelong union';
      initial.time = '5:00 PM';
      initial.endTime = '7:30 PM';
      initial.dressCode = 'Formal / Regal Traditional';
      initial.description = 'Witness our sacred vows and the auspicious rituals as we begin our lifelong journey together hand in hand.';
      initial.scheduleHighlights = ['5:00 PM - Guest Welcoming & Seating', '5:45 PM - Sacred Nuptial Vows & Ring Exchange', '7:00 PM - Blessings & Photography'];
    } else if (preset === 'reception') {
      initial.type = 'reception';
      initial.category = 'reception';
      initial.customCategoryLabel = 'Evening Dinner & Reception';
      initial.icon = '🍽️';
      initial.name = 'Dinner Banquet & Reception';
      initial.subtitle = 'Welcome reception, multi-course dinner feast, and celebration';
      initial.time = '7:30 PM';
      initial.endTime = '11:30 PM';
      initial.dressCode = 'Black Tie / Evening Glamour';
      initial.description = 'Celebrate our new beginning with an unforgettable evening of gourmet dining, heartfelt speeches, and celebration with loved ones.';
      initial.scheduleHighlights = ['7:30 PM - Welcome Reception & Refreshments', '8:30 PM - Speeches & Grand Dinner Feast', '9:30 PM - Celebration & Photography'];
    } else if (preset === 'cocktail') {
      initial.type = 'custom';
      initial.category = 'cocktail';
      initial.customCategoryLabel = 'Welcome Social Hour';
      initial.icon = '✨';
      initial.name = 'Welcome Social Hour';
      initial.subtitle = 'Sunset mocktails, hors d’oeuvres, and warm reunions';
      initial.time = '6:00 PM';
      initial.endTime = '9:00 PM';
      initial.dressCode = 'Smart Casual / Festive Chic';
    }

    setFormData(initial);
    setNewScheduleItem('');
    setIsCreatingNew(true);
    setEditingEvent(null);
  };

  const handleStartEdit = (event: WeddingEvent) => {
    setEditingEvent(event);
    const copy = JSON.parse(JSON.stringify(event));
    if (!copy.scheduleHighlights) {
      copy.scheduleHighlights = [];
    }
    setFormData(copy);
    setNewScheduleItem('');
    setIsCreatingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.time || !formData.venue?.name) {
      alert('Please fill in Event Name, Time, and Venue Name.');
      return;
    }

    // Ensure date is properly resolved and synchronized
    let resolvedDate = formData.date;
    if (formData.formattedDate) {
      const parsed = new Date(formData.formattedDate);
      if (!isNaN(parsed.getTime())) {
        const y = String(parsed.getFullYear());
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        resolvedDate = `${y}-${m}-${d}`;
      }
    }
    if (!resolvedDate) {
      resolvedDate = project.weddingDate ? project.weddingDate.split('T')[0] : '2026-10-13';
    }

    const finalEventData: WeddingEvent = {
      ...(formData as WeddingEvent),
      date: resolvedDate,
    };

    let updatedEvents = [...project.events];

    if (isCreatingNew) {
      updatedEvents.push(finalEventData);

      const updatedProject = {
        ...project,
        events: updatedEvents,
      };
      onProjectUpdated(updatedProject);
      showToast('Event created successfully!');
    } else if (editingEvent) {
      const index = updatedEvents.findIndex((e) => e.id === editingEvent.id);
      if (index >= 0) {
        updatedEvents[index] = finalEventData;
      }
      const updatedProject = {
        ...project,
        events: updatedEvents,
      };
      onProjectUpdated(updatedProject);
      showToast('Event updated successfully!');
    }

    setIsCreatingNew(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    if (project.events.length <= 1) {
      alert('You must have at least one event configured.');
      return;
    }
    if (confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = project.events.filter((e) => e.id !== id);
      // Also remove from invitation links
      const updatedLinks = project.invitationLinks.map((link) => ({
        ...link,
        eventIds: link.eventIds.filter((eid) => eid !== id),
      }));

      const updatedProject = {
        ...project,
        events: updatedEvents,
        invitationLinks: updatedLinks,
      };
      onProjectUpdated(updatedProject);
      showToast('Event deleted.');
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
            Event & Venue Management
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Define multi-day wedding events (Haldi, Mehndi, Sangeet, Baraat, Pheras, Ceremony, Reception). Set venues, dates, Google Maps links, and schedule highlights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStartCreate()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Event</span>
          </button>
        </div>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Quick Add Presets:</span>
          </span>
          <span className="text-[11px] text-stone-400">Click to instantly create a pre-filled event template</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleStartCreate('nikah')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🌙</span>
            <span>+ Sacred Nikah</span>
          </button>
          <button
            onClick={() => handleStartCreate('walima')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-100 text-teal-900 hover:bg-teal-200 border border-teal-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🍽️</span>
            <span>+ Walima Banquet</span>
          </button>
          <button
            onClick={() => handleStartCreate('mayun')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🟡</span>
            <span>+ Mayun / Haldi</span>
          </button>
          <button
            onClick={() => handleStartCreate('mehndi')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-lime-100 text-lime-900 hover:bg-lime-200 border border-lime-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🌿</span>
            <span>+ Mehndi Celebration</span>
          </button>
          <button
            onClick={() => handleStartCreate('sangeet')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🪩</span>
            <span>+ Sangeet Musical Night</span>
          </button>
          <button
            onClick={() => handleStartCreate('baraat')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-100 text-pink-900 hover:bg-pink-200 border border-pink-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🐎</span>
            <span>+ Royal Baraat</span>
          </button>
          <button
            onClick={() => handleStartCreate('reception')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border border-indigo-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>🍽️</span>
            <span>+ Reception Banquet</span>
          </button>
          <button
            onClick={() => handleStartCreate('pheras')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>💍</span>
            <span>+ Ceremony / Vows</span>
          </button>
          <button
            onClick={() => handleStartCreate('cocktail')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <span>✨</span>
            <span>+ Welcome Social</span>
          </button>
        </div>
      </div>

      {/* Event Cards List */}
      <div className="space-y-4">
        {project.events.map((evt, idx) => {
          const badge = getResolvedBadge(evt);
          const scheduleCount = (evt.scheduleHighlights || []).length;

          return (
            <div
              key={evt.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs hover:border-stone-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    {evt.name}
                  </h3>
                  
                  {/* Category / Ritual Badge */}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>

                  {/* Program Schedule count indicator */}
                  {scheduleCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{scheduleCount} Program items</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-normal text-stone-400 border border-dashed border-stone-200">
                      No schedule items
                    </span>
                  )}
                </div>

                {evt.subtitle && (
                  <p className="text-xs text-stone-500">{evt.subtitle}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>{evt.formattedDate}</strong> • {evt.time} {evt.endTime ? `– ${evt.endTime}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      <strong>{evt.venue.name}</strong>, {evt.venue.address}
                    </span>
                  </div>

                  {evt.dressCode && (
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>Attire: {evt.dressCode}</span>
                    </div>
                  )}

                  {evt.venue.parkingInfo && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-stone-400 shrink-0" />
                      <span className="truncate">{evt.venue.parkingInfo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                <button
                  onClick={() => handleStartEdit(evt)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {(isCreatingNew || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900">
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {isCreatingNew ? 'Create New Event' : `Edit "${formData.name}"`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingEvent(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Event Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sacred Nikah Ceremony"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Category / Ritual Type
                  </label>
                  <select
                    value={formData.category || 'ceremony'}
                    onChange={(e) => {
                      const newCat = e.target.value as EventCategory;
                      let updated = { ...formData, category: newCat };
                      // If user hasn't explicitly customized label/icon yet, provide good defaults
                      if (!formData.customCategoryLabel) {
                        if (newCat === 'nikah') updated.customCategoryLabel = 'Sacred Nikah Ceremony';
                        else if (newCat === 'walima') updated.customCategoryLabel = 'Walima Banquet';
                        else if (newCat === 'mayun') updated.customCategoryLabel = 'Mayun & Ubtan Ritual';
                        else if (newCat === 'pheras') updated.customCategoryLabel = 'Sacred Ceremony & Vows';
                        else if (newCat === 'reception') updated.customCategoryLabel = 'Reception Banquet';
                        else if (newCat === 'cocktail') updated.customCategoryLabel = 'Welcome Social';
                      }
                      if (!formData.icon) {
                        if (newCat === 'nikah') updated.icon = '🌙';
                        else if (newCat === 'walima') updated.icon = '🍽️';
                        else if (newCat === 'mayun') updated.icon = '🟡';
                        else if (newCat === 'reception') updated.icon = '🍽️';
                        else if (newCat === 'cocktail') updated.icon = '✨';
                      }
                      setFormData(updated);
                    }}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <optgroup label="Islamic / Muslim Ceremonies">
                      <option value="nikah">🌙 Sacred Nikah Ceremony</option>
                      <option value="walima">🍽️ Walima Banquet</option>
                      <option value="mayun">🟡 Mayun & Ubtan Ceremony</option>
                    </optgroup>
                    <optgroup label="Traditional & Cultural Ceremonies">
                      <option value="haldi">🟡 Haldi Ritual</option>
                      <option value="mehndi">🌿 Mehndi Celebration</option>
                      <option value="sangeet">🪩 Sangeet & Musical Night</option>
                      <option value="baraat">🐎 Royal Baraat Procession</option>
                      <option value="pheras">💍 Sacred Ceremony & Vows</option>
                    </optgroup>
                    <optgroup label="Receptions & Gatherings">
                      <option value="ceremony">💒 Nuptial Ceremony</option>
                      <option value="reception">🍽️ Reception Banquet</option>
                      <option value="dinner">🍲 Celebration Dinner</option>
                      <option value="cocktail">✨ Welcome Social / Gathering</option>
                      <option value="party">🎉 Celebration Gathering</option>
                      <option value="brunch">🥞 Farewell Brunch</option>
                      <option value="custom">✨ Custom Event</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Invitation Mapping
                  </label>
                  <select
                    value={formData.type || 'wedding'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'wedding' | 'reception' | 'custom',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="wedding">Wedding / Ceremony Links</option>
                    <option value="reception">Reception / Walima Links</option>
                    <option value="custom">All Combined / Custom</option>
                  </select>
                </div>
              </div>

              {/* Custom Ritual Label & Icon Customizer */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Custom Ritual Name & Icon Customization</span>
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Rename badge or replace icons (e.g. Muslim Nikah, Walima, or custom traditions)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Custom Category / Ritual Badge Title
                    </label>
                    <input
                      type="text"
                      value={formData.customCategoryLabel || ''}
                      onChange={(e) => setFormData({ ...formData, customCategoryLabel: e.target.value })}
                      placeholder="e.g. Sacred Nikah Ceremony, Walima Banquet, Sacred Vows..."
                      className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Overrides the default badge on invitation cards (replaces "Sacred Pheras", etc.).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Event Icon / Emoji
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.icon || ''}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="e.g. 🌙 or 🍽️"
                        className="w-16 px-3 py-2 text-center text-lg bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {['🌙', '🕌', '🍽️', '💍', '🤍', '🌸', '🌹', '🕊️', '✨', '📜', '👑', '🌿', '🟡', '🐎', '🥞'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon: emoji })}
                            className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all ${
                              formData.icon === emoji
                                ? 'bg-rose-100 border-rose-400 scale-110 shadow-xs'
                                : 'bg-white border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200/50 text-xs">
                  <span className="text-stone-500 text-[11px]">Preview on guest invitation card:</span>
                  {(() => {
                    const badge = getResolvedBadge(formData);
                    return (
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subtitle / Brief Tagline
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Exchange of vows, rings, and marriage blessing"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>Event Date *</span>
                    <span className="text-[10px] text-rose-600 font-semibold">Calendar Sync</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date ? formData.date.split('T')[0] : ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      let newFormatted = formData.formattedDate;
                      if (newDate) {
                        try {
                          const [year, month, day] = newDate.split('-').map(Number);
                          const d = new Date(year, month - 1, day);
                          newFormatted = d.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        } catch {}
                      }
                      setFormData({
                        ...formData,
                        date: newDate,
                        formattedDate: newFormatted,
                      });
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Display Date (Formatted) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.formattedDate || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      let parsedDate = formData.date;
                      const d = new Date(text);
                      if (!isNaN(d.getTime())) {
                        const y = String(d.getFullYear());
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        parsedDate = `${y}-${m}-${day}`;
                      }
                      setFormData({ ...formData, formattedDate: text, date: parsedDate });
                    }}
                    placeholder="e.g. Saturday, October 13, 2026"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 3:30 PM"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="e.g. 5:00 PM"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Venue Information Section */}
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
                  Venue & Location Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venue?.name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue!, name: e.target.value },
                        })
                      }
                      placeholder="e.g. St. Claire Vineyard Chapel"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venue?.address || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue!, address: e.target.value },
                        })
                      }
                      placeholder="e.g. 1420 Lakeview Crest Road"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      City, State & Zip *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.venue?.cityStateZip || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue!, cityStateZip: e.target.value },
                        })
                      }
                      placeholder="e.g. Napa Valley, CA 94558"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Google Maps URL
                    </label>
                    <input
                      type="text"
                      value={formData.venue?.mapsUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          venue: { ...formData.venue!, mapsUrl: e.target.value },
                        })
                      }
                      placeholder="https://maps.google.com/..."
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Attire & Parking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Dress Code / Attire Note
                  </label>
                  <input
                    type="text"
                    value={formData.dressCode || ''}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                    placeholder="e.g. Black Tie Optional"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Parking & Transportation
                  </label>
                  <input
                    type="text"
                    value={formData.venue?.parkingInfo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venue: { ...formData.venue!, parkingInfo: e.target.value },
                      })
                    }
                    placeholder="e.g. Valet parking at entrance"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Program Schedule Highlights Editor */}
              <div className="pt-3 border-t border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Program Schedule & Timeline</span>
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Add, edit, or remove specific timeline milestones shown on this event's guest invitation card.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-stone-400">Quick templates:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          scheduleHighlights: [
                            '6:00 PM - Welcome Reception & Refreshments',
                            '6:45 PM - Recitation of Holy Quran & Khutbah',
                            '7:15 PM - Solemn Nikah Signing & Ijab-e-Qubool',
                            '8:00 PM - Heartfelt Dua & Family Greetings',
                            '8:30 PM - Royal Festive Feast'
                          ]
                        });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold"
                    >
                      + Nikah
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          scheduleHighlights: [
                            '7:30 PM - Guest Welcoming & Welcome Drinks',
                            '8:30 PM - Couple Entrance & Stage Greetings',
                            '9:00 PM - Sumptuous Dinner Feast',
                            '10:15 PM - Photography & Farewell Wishes'
                          ]
                        });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 font-semibold"
                    >
                      + Walima
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          scheduleHighlights: [
                            '5:00 PM - Guest Arrival & Seating',
                            '5:45 PM - Nuptial Ceremony & Ring Exchange',
                            '6:45 PM - Family Portraits & Toasts',
                            '7:30 PM - Grand Dinner Celebration'
                          ]
                        });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold"
                    >
                      + Ceremony
                    </button>
                    {(formData.scheduleHighlights || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, scheduleHighlights: [] });
                        }}
                        className="px-2 py-0.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* List of current schedule highlights */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(formData.scheduleHighlights || []).length === 0 ? (
                    <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center">
                      <p className="text-xs text-stone-400">
                        No schedule milestones added yet. Type below to add items (e.g., "7:00 PM - Guest Welcome").
                      </p>
                    </div>
                  ) : (
                    formData.scheduleHighlights!.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center gap-2 bg-stone-50/80 p-1.5 rounded-xl border border-stone-200 focus-within:border-rose-300 transition-all"
                      >
                        <span className="w-5 h-5 rounded-full bg-stone-200/70 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {itemIdx + 1}
                        </span>

                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...(formData.scheduleHighlights || [])];
                            updated[itemIdx] = e.target.value;
                            setFormData({ ...formData, scheduleHighlights: updated });
                          }}
                          placeholder="Milestone description..."
                          className="flex-1 bg-transparent px-2 py-1 text-xs font-medium text-stone-800 focus:outline-none"
                        />

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={itemIdx === 0}
                            onClick={() => {
                              if (itemIdx === 0) return;
                              const updated = [...(formData.scheduleHighlights || [])];
                              const temp = updated[itemIdx - 1];
                              updated[itemIdx - 1] = updated[itemIdx];
                              updated[itemIdx] = temp;
                              setFormData({ ...formData, scheduleHighlights: updated });
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-200/50"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={itemIdx === (formData.scheduleHighlights || []).length - 1}
                            onClick={() => {
                              if (itemIdx >= (formData.scheduleHighlights || []).length - 1) return;
                              const updated = [...(formData.scheduleHighlights || [])];
                              const temp = updated[itemIdx + 1];
                              updated[itemIdx + 1] = updated[itemIdx];
                              updated[itemIdx] = temp;
                              setFormData({ ...formData, scheduleHighlights: updated });
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-200/50"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.scheduleHighlights || []).filter((_, idx) => idx !== itemIdx);
                              setFormData({ ...formData, scheduleHighlights: updated });
                            }}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 ml-1"
                            title="Remove Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new schedule milestone input */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newScheduleItem}
                      onChange={(e) => setNewScheduleItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newScheduleItem.trim()) {
                            const updated = [...(formData.scheduleHighlights || []), newScheduleItem.trim()];
                            setFormData({ ...formData, scheduleHighlights: updated });
                            setNewScheduleItem('');
                          }
                        }
                      }}
                      placeholder="e.g. 7:15 PM - Solemn Nikah Signing & Vows (Press Enter or Click Add)"
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newScheduleItem.trim()) {
                        const updated = [...(formData.scheduleHighlights || []), newScheduleItem.trim()];
                        setFormData({ ...formData, scheduleHighlights: updated });
                        setNewScheduleItem('');
                      }
                    }}
                    disabled={!newScheduleItem.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed border border-stone-300 transition-all shrink-0 flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Event Description & Guest Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special instructions, un-plugged ceremony request, dining style..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md active:scale-95"
                >
                  Save Event Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
