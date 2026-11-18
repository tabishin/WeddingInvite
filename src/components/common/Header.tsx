import React, { useState } from 'react';
import { 
  Heart, 
  Palette, 
  Eye, 
  Calendar, 
  Link as LinkIcon, 
  Users, 
  RotateCcw, 
  Sparkles, 
  LayoutDashboard,
  Shield,
  LogOut,
  UserCheck,
  Languages,
  Camera
} from 'lucide-react';
import { WeddingProject, WeddingTheme } from '../../types/wedding';
import { AdminSecurityModal } from '../admin/AdminSecurityModal';
import { getAdminCredentials } from '../../services/auth';

interface HeaderProps {
  project: WeddingProject;
  theme: WeddingTheme;
  activeTab: 'overview' | 'themes' | 'events' | 'links' | 'rsvps' | 'fonts' | 'photos';
  onSelectTab: (tab: 'overview' | 'themes' | 'events' | 'links' | 'rsvps' | 'fonts' | 'photos') => void;
  onOpenGuestView: (linkCode?: string) => void;
  onOpenLiveSimulator: () => void;
  onResetProject: () => void;
  onLogout: () => void;
}

interface NavTabItem {
  id: 'overview' | 'themes' | 'events' | 'links' | 'rsvps' | 'fonts' | 'photos';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  theme,
  activeTab,
  onSelectTab,
  onOpenGuestView,
  onOpenLiveSimulator,
  onResetProject,
  onLogout,
}) => {
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState(() => getAdminCredentials().username);

  const tabs: NavTabItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'photos', label: 'Photos & Albums', icon: Camera, badge: project.photos?.length || 0 },
    { id: 'themes', label: 'Aesthetic Themes', icon: Palette, badge: '30' },
    { id: 'fonts', label: 'Fonts & Scripts (اردو/हिंदी)', icon: Languages, badge: 'Multilingual' },
    { id: 'events', label: 'Events & Venues', icon: Calendar, badge: project.events.length },
    { id: 'links', label: 'Invitation Links (1, 2, 3)', icon: LinkIcon, badge: project.invitationLinks.length },
    { id: 'rsvps', label: 'Guest RSVPs', icon: Users, badge: project.rsvps?.length || 0 },
  ];

  const handleCredentialsUpdated = () => {
    setAdminUsername(getAdminCredentials().username);
  };

  return (
    <>
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        {/* Top Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Wedding Title */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-stone-900 tracking-tight">
                  {project.couple.formattedTitle}
                </h1>
                <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>{adminUsername} (Admin)</span>
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {project.weddingDateFormatted} • Theme: <strong style={{ color: theme.colors.primary }}>{theme.name}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Security / Change Credentials */}
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              title="Security Settings (Change User ID & Password)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Admin Security</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetProject}
              title="Reset to default demo wedding data"
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Live Phone Simulator */}
            <button
              onClick={onOpenLiveSimulator}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Device Simulator</span>
            </button>

            {/* View Live Invitation as Guest */}
            <button
              onClick={() => onOpenGuestView('3')}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Guest Link (?invite=3)</span>
            </button>

            {/* Log Out Button */}
            <button
              onClick={onLogout}
              title="Log out from Admin Dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-stone-100 py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-50 text-rose-800 shadow-xs border border-rose-200/80 font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-600' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                        isActive
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Admin Security Settings Modal */}
      <AdminSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        theme={theme}
        onCredentialsUpdated={handleCredentialsUpdated}
      />
    </>
  );
};

