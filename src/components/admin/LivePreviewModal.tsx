import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Eye, 
  ExternalLink, 
  Sparkles, 
  Palette,
  Share2
} from 'lucide-react';
import { WeddingProject, WeddingTheme, InvitationLink } from '../../types/wedding';
import { GuestInvitationView } from '../guest/GuestInvitationView';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: WeddingProject;
  theme: WeddingTheme;
  onThemeChanged: (theme: WeddingTheme) => void;
  onProjectUpdated: (project: WeddingProject) => void;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  project,
  theme,
  onThemeChanged,
  onProjectUpdated,
}) => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [activeLinkCode, setActiveLinkCode] = useState<string>(
    project.invitationLinks[0]?.code || 'wedding-reception'
  );

  if (!isOpen) return null;

  const currentLink = project.invitationLinks.find((l) => l.code === activeLinkCode) || project.invitationLinks[0];

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile':
        return 'max-w-[400px] h-[780px] rounded-[42px] border-[10px] border-stone-800 shadow-2xl';
      case 'tablet':
        return 'max-w-[760px] h-[820px] rounded-[32px] border-[8px] border-stone-800 shadow-2xl';
      case 'desktop':
        return 'max-w-full h-[85vh] rounded-2xl border border-stone-300 shadow-xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 text-white w-full max-w-6xl h-[92vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-stone-800">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Live Invitation Simulator</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-medium">
              {theme.name}
            </span>
          </div>

          {/* Invitation Link Switcher */}
          <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800">
            {project.invitationLinks.map((l) => {
              const isActive = l.code === activeLinkCode;
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveLinkCode(l.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {l.type === 'wedding_only' && '💍 Wedding Only'}
                  {l.type === 'reception_only' && '🥂 Reception Only'}
                  {l.type === 'wedding_reception' && '✨ Wedding + Reception'}
                  {l.type === 'custom' && l.title}
                </button>
              );
            })}
          </div>

          {/* Device viewport Switcher & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === 'mobile' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
                }`}
                title="Mobile View (iPhone)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === 'tablet' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
                }`}
                title="Tablet View (iPad)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === 'desktop' ? 'bg-stone-700 text-white' : 'text-stone-400 hover:text-white'
                }`}
                title="Full Responsive View"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 bg-stone-950/60 p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
          <div
            className={`w-full transition-all duration-300 overflow-y-auto relative bg-white ${getDeviceWidth()}`}
          >
            <GuestInvitationView
              project={project}
              theme={theme}
              activeLinkCode={activeLinkCode}
              onNavigateToAdmin={onClose}
              onSwitchLink={(code) => setActiveLinkCode(code)}
              onProjectUpdated={onProjectUpdated}
              isHostPreviewMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
