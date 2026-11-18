import React, { useState, useEffect } from 'react';
import { 
  saveWeddingProject, 
  resetWeddingProject, 
  getThemeById,
  fetchServerWeddingProject,
  subscribeToProjectUpdates,
  getInjectedProject,
} from './services/storage';
import { isAdminAuthenticated, logoutAdmin, syncServerCredentials } from './services/auth';
import { WeddingProject, WeddingTheme } from './types/wedding';
import { Header } from './components/common/Header';
import { DashboardOverview } from './components/admin/DashboardOverview';
import { ThemeSelector } from './components/admin/ThemeSelector';
import { EventManager } from './components/admin/EventManager';
import { LinkManager } from './components/admin/LinkManager';
import { RsvpManager } from './components/admin/RsvpManager';
import { FontLanguageStudio } from './components/admin/FontLanguageStudio';
import { LivePreviewModal } from './components/admin/LivePreviewModal';
import { GuestInvitationView } from './components/guest/GuestInvitationView';
import { PhotoGallerySection } from './components/guest/PhotoGallerySection';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { INITIAL_WEDDING_PROJECT } from './data/initialData';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const initialInjected = getInjectedProject();
  const [project, setProject] = useState<WeddingProject>(initialInjected || INITIAL_WEDDING_PROJECT);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(!initialInjected);
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'events' | 'links' | 'rsvps' | 'fonts' | 'photos'>('overview');
  const [viewMode, setViewMode] = useState<'admin' | 'guest'>('guest');
  const [guestLinkCode, setGuestLinkCode] = useState<string>('3');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());

  // Active theme based on project selection
  const activeTheme: WeddingTheme = getThemeById(project.selectedThemeId);

  // Initialize from URL parameters and sync with server database on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    const adminParam = params.get('admin');

    if (adminParam) {
      setViewMode('admin');
    } else if (inviteParam) {
      setGuestLinkCode(inviteParam);
      setViewMode('guest');
    } else {
      // Default to guest view if not specified
      setViewMode('guest');
    }

    // Apply authoritative project state from SQLite database
    const applyServerProject = (serverProj: WeddingProject) => {
      if (!serverProj || !serverProj.couple) return;
      setProject((prev) => {
        // Fast equality check: if nothing meaningful changed, keep previous reference
        if (
          prev.version === serverProj.version &&
          prev.updatedAt === serverProj.updatedAt &&
          prev.selectedThemeId === serverProj.selectedThemeId &&
          prev.couple?.formattedTitle === serverProj.couple?.formattedTitle &&
          prev.couple?.partner1 === serverProj.couple?.partner1 &&
          prev.couple?.partner2 === serverProj.couple?.partner2 &&
          prev.events?.length === serverProj.events?.length &&
          prev.invitationLinks?.length === serverProj.invitationLinks?.length &&
          prev.photos?.length === serverProj.photos?.length &&
          prev.albums?.length === serverProj.albums?.length &&
          prev.showPhotosSection === serverProj.showPhotosSection &&
          prev.allowGuestPhotoUploads === serverProj.allowGuestPhotoUploads
        ) {
          return prev;
        }
        console.log(`[App] 🔄 Applying project from database: v${serverProj.version || 1} - "${serverProj.couple?.formattedTitle}" (${serverProj.couple?.partner1} & ${serverProj.couple?.partner2}) [Theme: ${serverProj.selectedThemeId}]`);
        return serverProj;
      });
      setIsLoadingDB(false);
    };

    // 1. Subscribe to real-time pushes via Server-Sent Events (SSE) for instant zero-latency sync across all browsers
    const unsubscribeSSE = subscribeToProjectUpdates((liveProject) => {
      applyServerProject(liveProject);
    });

    // 2. Initial fetch & resilient background polling
    const syncWithServer = async (isInitial = false) => {
      try {
        const serverProj = await fetchServerWeddingProject();
        if (serverProj) {
          applyServerProject(serverProj);
        }
      } catch (err) {
        console.warn('Sync with database:', err);
      } finally {
        if (isInitial) {
          setIsLoadingDB(false);
        }
      }
    };

    // Initial immediate fetch from SQLite DB
    syncWithServer(true);
    syncServerCredentials();

    // Re-sync whenever the window or tab gains focus or becomes visible
    const handleFocus = () => syncWithServer(false);
    window.addEventListener('focus', handleFocus);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithServer(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Live continuous sync interval (every 2 seconds) for multi-browser and multi-device real-time updates
    const interval = setInterval(() => syncWithServer(false), 2000);

    return () => {
      unsubscribeSSE();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  // Sync URL when navigating to guest view
  const handleOpenGuestView = (linkCode?: string) => {
    const targetCode = linkCode || guestLinkCode || '3';
    setGuestLinkCode(targetCode);
    setViewMode('guest');
    
    // Update browser URL query without reload
    const newUrl = `${window.location.pathname}?invite=${targetCode}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleNavigateToAdmin = () => {
    setViewMode('admin');
    const newUrl = `${window.location.pathname}?admin=true`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
  };

  const handleSwitchGuestLink = (code: string) => {
    setGuestLinkCode(code);
    const newUrl = `${window.location.pathname}?invite=${code}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleThemeChanged = async (newTheme: WeddingTheme) => {
    const updated: WeddingProject = {
      ...project,
      selectedThemeId: newTheme.id,
      updatedAt: new Date().toISOString(),
    };
    setProject(updated);
    const res = await saveWeddingProject(updated);
    if (res && res.project) {
      setProject(res.project);
    }
  };

  const handleProjectUpdated = async (updated: WeddingProject) => {
    const timestamped: WeddingProject = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setProject(timestamped);
    console.log('[App] handleProjectUpdated: Saving new couple data:', timestamped.couple);
    const res = await saveWeddingProject(timestamped);
    if (res && res.project) {
      console.log('[App] handleProjectUpdated: Received saved project from database:', res.project.couple?.formattedTitle, 'version:', res.project.version);
      setProject(res.project);
    }
  };

  const handleResetProject = async () => {
    if (confirm('Reset portal back to default sample wedding data in database?')) {
      const reset = await resetWeddingProject();
      setProject(reset);
      setGuestLinkCode('3');
    }
  };

  // Luxury Initial Loading Screen while hydrating directly from lightweight database
  if (isLoadingDB) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 50%, #FDF2F8 100%)',
          color: '#881337',
        }}
      >
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-rose-300 border-t-rose-600 animate-spin" />
          <Heart className="w-6 h-6 text-rose-500 absolute animate-pulse fill-rose-500/20" />
        </div>
        <p className="text-sm font-semibold tracking-widest uppercase text-stone-500 mb-1">
          Opening Sacred Celebration
        </p>
        <p className="text-xl font-serif text-stone-800 italic">
          Loading invitation details...
        </p>
      </div>
    );
  }

  // If in guest invitation view mode, render the clean guest-facing portal
  if (viewMode === 'guest') {
    return (
      <GuestInvitationView
        project={project}
        theme={activeTheme}
        activeLinkCode={guestLinkCode}
        onNavigateToAdmin={handleNavigateToAdmin}
        onSwitchLink={handleSwitchGuestLink}
        onProjectUpdated={handleProjectUpdated}
      />
    );
  }

  // If in Admin mode but NOT authenticated, require user ID & password
  if (!isAuthenticated) {
    return (
      <AdminLoginView
        theme={activeTheme}
        coupleTitle={project.couple.formattedTitle}
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToGuestView={() => handleOpenGuestView()}
      />
    );
  }

  // Authenticated Admin Dashboard Mode
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-rose-100 selection:text-rose-900">
      {/* Admin Header */}
      <Header
        project={project}
        theme={activeTheme}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenGuestView={handleOpenGuestView}
        onOpenLiveSimulator={() => setIsSimulatorOpen(true)}
        onResetProject={handleResetProject}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && (
          <DashboardOverview
            project={project}
            theme={activeTheme}
            onNavigateTab={setActiveTab}
            onOpenGuestView={handleOpenGuestView}
            onProjectUpdated={handleProjectUpdated}
          />
        )}

        {activeTab === 'themes' && (
          <ThemeSelector
            project={project}
            activeTheme={activeTheme}
            onThemeChanged={handleThemeChanged}
            onOpenGuestView={handleOpenGuestView}
          />
        )}

        {activeTab === 'events' && (
          <EventManager
            project={project}
            onProjectUpdated={handleProjectUpdated}
          />
        )}

        {activeTab === 'links' && (
          <LinkManager
            project={project}
            theme={activeTheme}
            onProjectUpdated={handleProjectUpdated}
            onOpenGuestView={handleOpenGuestView}
          />
        )}

        {activeTab === 'rsvps' && (
          <RsvpManager
            project={project}
            onProjectUpdated={handleProjectUpdated}
          />
        )}

        {activeTab === 'fonts' && (
          <FontLanguageStudio
            project={project}
            theme={activeTheme}
            onProjectUpdated={handleProjectUpdated}
            onOpenGuestView={handleOpenGuestView}
          />
        )}

        {activeTab === 'photos' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200">
            <PhotoGallerySection
              project={project}
              theme={activeTheme}
              onProjectUpdated={handleProjectUpdated}
              isAdmin={true}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Wedding Invitation Portal • Powered by Database Sync & Multi-Device Live Mirroring
          </p>
          <div className="flex items-center gap-4 font-semibold text-stone-600">
            <button onClick={() => handleOpenGuestView('1')} className="hover:text-rose-600">
              Wedding Only (?invite=1)
            </button>
            <button onClick={() => handleOpenGuestView('2')} className="hover:text-rose-600">
              Reception Only (?invite=2)
            </button>
            <button onClick={() => handleOpenGuestView('3')} className="hover:text-rose-600">
              Full Wedding + Reception (?invite=3)
            </button>
          </div>
        </div>
      </footer>

      {/* Live Device Simulator Modal */}
      <LivePreviewModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        project={project}
        theme={activeTheme}
        onThemeChanged={handleThemeChanged}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  );
}
