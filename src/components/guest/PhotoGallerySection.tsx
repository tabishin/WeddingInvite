import React, { useState, useRef, useMemo } from 'react';
import { 
  Camera, 
  FolderPlus, 
  Heart, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Trash2, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Edit3,
  Lock,
  Layers
} from 'lucide-react';
import { WeddingProject, WeddingTheme, PhotoAlbum, WeddingPhoto } from '../../types/wedding';
import { uploadPhotoToDB, createAlbumInDB, deleteAlbumFromDB, deletePhotoFromDB, likePhotoInDB } from '../../services/storage';

// Only the single primary core wedding album is protected from deletion,
// or any album if it is the only remaining album in the wedding portal.
export const CORE_PROTECTED_ALBUM_ID = 'album-wedding';

export const isAlbumProtected = (album: PhotoAlbum, totalAlbumsCount?: number): boolean => {
  if (totalAlbumsCount !== undefined && totalAlbumsCount <= 1) {
    return true;
  }
  return album.id === CORE_PROTECTED_ALBUM_ID;
};

interface PhotoGallerySectionProps {
  project: WeddingProject;
  theme: WeddingTheme;
  headingFont?: string;
  bodyFont?: string;
  onProjectUpdated?: (updated: WeddingProject) => void;
  isAdmin?: boolean;
}

export const PhotoGallerySection: React.FC<PhotoGallerySectionProps> = ({
  project,
  theme,
  headingFont = theme.fontFamily.heading,
  bodyFont = theme.fontFamily.body,
  onProjectUpdated,
  isAdmin = false,
}) => {
  const albums: PhotoAlbum[] = project.albums || [];
  const photos: WeddingPhoto[] = project.photos || [];

  // Permissions & feature visibility
  const showPhotosSection = project.showPhotosSection !== false;
  const allowGuestUploads = project.allowGuestPhotoUploads !== false;
  const canUploadPhotos = isAdmin || allowGuestUploads;
  const canCreateAlbum = isAdmin; // Guests cannot create albums; only hosts/admins can create albums

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = useState(false);

  // Upload Form state
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploadAlbumId, setUploadAlbumId] = useState<string>(albums[0]?.id || 'album-candids');
  const [newAlbumTitleForUpload, setNewAlbumTitleForUpload] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // New Album Form state
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumCreator, setNewAlbumCreator] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  // Liked photos tracking in current browser session
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set());

  // Admin View sub-tab: 'gallery' | 'albums'
  const [adminViewMode, setAdminViewMode] = useState<'gallery' | 'albums'>('gallery');

  // Edit / Rename Album state
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [editAlbumTitle, setEditAlbumTitle] = useState('');
  const [editAlbumDesc, setEditAlbumDesc] = useState('');
  const [isSavingAlbumEdit, setIsSavingAlbumEdit] = useState(false);
  const [isDeletingAlbumId, setIsDeletingAlbumId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered photos based on active album
  const filteredPhotos = useMemo(() => {
    if (selectedAlbumId === 'all') return photos;
    return photos.filter((p) => p.albumId === selectedAlbumId);
  }, [photos, selectedAlbumId]);

  // Active album details
  const currentAlbum = useMemo(() => {
    if (selectedAlbumId === 'all') return null;
    return albums.find((a) => a.id === selectedAlbumId);
  }, [albums, selectedAlbumId]);

  // Handle files selected via file dialog or drag & drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    addFilesToUpload(files);
  };

  const addFilesToUpload = (files: File[]) => {
    const validImages = files.filter((f) => f.type.startsWith('image/'));
    const previews = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedFiles((prev) => [...prev, ...previews]);
  };

  const removeFileFromUpload = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Photo Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUploadPhotos || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadSuccessMsg('');

    try {
      let targetAlbumId = uploadAlbumId;

      // If user typed a new album inline during upload (Admin only)
      if (canCreateAlbum && uploadAlbumId === '__new__' && newAlbumTitleForUpload.trim()) {
        const albumRes = await createAlbumInDB({
          title: newAlbumTitleForUpload.trim(),
          createdBy: 'couple',
          uploaderName: uploaderName.trim() || undefined,
        });
        targetAlbumId = albumRes.album.id;
        if (albumRes.project && onProjectUpdated) {
          onProjectUpdated(albumRes.project);
        }
      }

      // Convert files to base64 and upload sequentially
      let lastProject = project;
      for (const item of selectedFiles) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(item.file);
        });

        const res = await uploadPhotoToDB({
          dataUrl: base64Data,
          albumId: targetAlbumId,
          caption: photoCaption.trim() || undefined,
          uploaderName: uploaderName.trim() || (isAdmin ? project.couple.formattedTitle : 'Wedding Guest'),
          uploaderType: isAdmin ? 'couple' : 'guest',
        });

        if (res.project) {
          lastProject = res.project;
        }
      }

      if (onProjectUpdated) {
        onProjectUpdated(lastProject);
      }

      setUploadSuccessMsg(`Successfully uploaded ${selectedFiles.length} photo(s)!`);
      setSelectedFiles([]);
      setPhotoCaption('');
      setNewAlbumTitleForUpload('');

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload photos. Please ensure files are valid images and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Create Album (Admin Only)
  const handleCreateAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateAlbum || !newAlbumTitle.trim()) return;

    setIsCreatingAlbum(true);
    try {
      const res = await createAlbumInDB({
        title: newAlbumTitle.trim(),
        description: newAlbumDesc.trim() || undefined,
        createdBy: isAdmin ? 'couple' : 'guest',
        uploaderName: newAlbumCreator.trim() || undefined,
      });

      if (res.project && onProjectUpdated) {
        onProjectUpdated(res.project);
      }

      setSelectedAlbumId(res.album.id);
      setNewAlbumTitle('');
      setNewAlbumDesc('');
      setNewAlbumCreator('');
      setIsNewAlbumModalOpen(false);
    } catch (err) {
      console.error('Failed to create album:', err);
      alert('Could not create album. Please try again.');
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  // Like a photo
  const handleLikePhoto = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (likedPhotoIds.has(photoId)) return;

    // Optimistic UI update
    setLikedPhotoIds((prev) => new Set(prev).add(photoId));

    try {
      const res = await likePhotoInDB(photoId);
      if (res.project && onProjectUpdated) {
        onProjectUpdated(res.project);
      }
    } catch (err) {
      console.warn('Like photo failed:', err);
    }
  };

  // Delete photo
  const handleDeletePhoto = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;

    try {
      const res = await deletePhotoFromDB(photoId);
      if (res.project && onProjectUpdated) {
        onProjectUpdated(res.project);
      }
      if (activeLightboxIndex !== null) {
        setActiveLightboxIndex(null);
      }
    } catch (err) {
      console.error('Delete photo failed:', err);
      alert('Failed to delete photo.');
    }
  };

  // Start renaming an album
  const handleStartEditAlbum = (album: PhotoAlbum) => {
    setEditingAlbum(album);
    setEditAlbumTitle(album.title);
    setEditAlbumDesc(album.description || '');
  };

  // Save renamed/edited album
  const handleSaveAlbumEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum || !editAlbumTitle.trim()) return;

    setIsSavingAlbumEdit(true);
    try {
      const res = await createAlbumInDB({
        id: editingAlbum.id,
        title: editAlbumTitle.trim(),
        description: editAlbumDesc.trim() || undefined,
        createdBy: 'couple',
      });
      if (res.project && onProjectUpdated) {
        onProjectUpdated(res.project);
      }
      setEditingAlbum(null);
    } catch (err) {
      console.error('Failed to rename album:', err);
      alert('Could not update album. Please try again.');
    } finally {
      setIsSavingAlbumEdit(false);
    }
  };

  // Delete an album (only the single core wedding album is protected; at least 1 album must remain)
  const handleDeleteAlbum = async (album: PhotoAlbum) => {
    if (isAlbumProtected(album, albums.length)) {
      alert(
        albums.length <= 1
          ? 'At least one album must remain in the wedding portal.'
          : `"${album.title}" is the primary core celebration album and cannot be deleted.`
      );
      return;
    }

    const count = photos.filter((p) => p.albumId === album.id).length;
    const fallbackTitle =
      albums.find((a) => a.id !== album.id && a.id === CORE_PROTECTED_ALBUM_ID)?.title ||
      albums.find((a) => a.id !== album.id)?.title ||
      'remaining celebration album';

    const confirmMsg = count > 0
      ? `Are you sure you want to delete the album "${album.title}"? Its ${count} photo(s) will be safely moved to "${fallbackTitle}".`
      : `Are you sure you want to delete the album "${album.title}"?`;

    if (!confirm(confirmMsg)) return;

    setIsDeletingAlbumId(album.id);
    try {
      const res = await deleteAlbumFromDB(album.id);
      if (res.project && onProjectUpdated) {
        onProjectUpdated(res.project);
      }
      if (selectedAlbumId === album.id) {
        setSelectedAlbumId('all');
      }
    } catch (err) {
      console.error('Failed to delete album:', err);
      alert('Could not delete album. Please try again.');
    } finally {
      setIsDeletingAlbumId(null);
    }
  };

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
  };

  const nextLightboxPhoto = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((activeLightboxIndex + 1) % filteredPhotos.length);
  };

  const prevLightboxPhoto = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((activeLightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  return (
    <section className="relative w-full max-w-5xl mx-auto my-14 px-3 sm:px-6">
      {/* Decorative Outer Card Frame */}
      <div
        className="relative rounded-3xl p-6 sm:p-10 shadow-2xl border transition-all duration-500 overflow-hidden"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.cardBorder,
          boxShadow: theme.decorations.cardShadow,
        }}
      >
        {/* Subtle Watermark Flourish */}
        <div className="absolute top-4 right-6 text-3xl opacity-20 pointer-events-none select-none">
          📸
        </div>

        {/* Host Control Bar (Shown in Admin Management Mode) */}
        {isAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-stone-950">
                  Host Controls
                </span>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Photo Section & Guest Upload Settings
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {showPhotosSection ? '✓ Photos visible to guests' : '✕ Photos hidden from guests'} • {allowGuestUploads ? 'Guest uploads active' : 'Guest uploads locked (Admin only)'} • Only Hosts can create albums
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onProjectUpdated?.({ ...project, showPhotosSection: !showPhotosSection })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showPhotosSection
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-400'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300'
                }`}
              >
                {showPhotosSection ? 'Section: Visible' : 'Section: Hidden'}
              </button>

              <button
                type="button"
                onClick={() => onProjectUpdated?.({ ...project, allowGuestPhotoUploads: !allowGuestUploads })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  allowGuestUploads
                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-400'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300'
                }`}
              >
                {allowGuestUploads ? 'Guest Uploads: Allowed' : 'Guest Uploads: Locked'}
              </button>

              <button
                type="button"
                onClick={() => setIsNewAlbumModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Create Album</span>
              </button>
            </div>

            {/* View Switcher: Photo Gallery View vs Manage Albums List */}
            <div className="w-full pt-3 mt-1 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/10">
                <button
                  type="button"
                  onClick={() => setAdminViewMode('gallery')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminViewMode === 'gallery'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Photo Gallery View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('albums')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    adminViewMode === 'albums'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Manage Albums List ({albums.length})</span>
                </button>
              </div>

              <div className="text-xs text-stone-500 font-medium">
                {albums.length} Albums • {photos.length} Photos total
              </div>
            </div>
          </div>
        )}

        {isAdmin && adminViewMode === 'albums' ? (
          /* ======================================================== */
          /* ADMIN ALBUM MANAGER LIST VIEW                            */
          /* ======================================================== */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: theme.colors.textHeading, fontFamily: headingFont }}>
                  Celebration Albums Management
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Core pre-created albums are permanently protected. You can create custom albums, rename any album, and view live photo counts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAlbumModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-900 shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Create Album</span>
                </button>
              </div>
            </div>

            {/* Albums List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {albums.map((album) => {
                const count = photos.filter((p) => p.albumId === album.id).length;
                const isProtected = isAlbumProtected(album, albums.length);

                return (
                  <div
                    key={album.id}
                    className="p-4 sm:p-5 rounded-2xl border transition-all bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Album Cover Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-amber-300/40 bg-stone-100 dark:bg-stone-800 relative">
                        {album.coverPhotoUrl ? (
                          <img
                            src={album.coverPhotoUrl}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-amber-500 bg-amber-500/10">
                            <Camera className="w-6 h-6" />
                            <span className="text-[9px] font-bold mt-1">No Cover</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white">
                          {count}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h4 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate">
                            {album.title}
                          </h4>
                          {isProtected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              <span>{albums.length <= 1 ? 'Protected (Last Album)' : 'Core (Protected)'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Celebration Album</span>
                            </span>
                          )}
                        </div>

                        {album.description ? (
                          <p className="text-xs text-stone-500 line-clamp-2 italic">
                            &ldquo;{album.description}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-stone-400 italic">No description provided</p>
                        )}

                        <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-400">
                          <span className="font-semibold text-stone-600 dark:text-stone-300">
                            {count} photo{count !== 1 ? 's' : ''} stored
                          </span>
                          {album.uploaderName && (
                            <>
                              <span>•</span>
                              <span>By {album.uploaderName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Rename / Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEditAlbum(album)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-amber-600" />
                          <span>Rename / Edit</span>
                        </button>

                        {/* View Photos Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAlbumId(album.id);
                            setAdminViewMode('gallery');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>View Photos ({count})</span>
                        </button>
                      </div>

                      {/* Delete Button (Protected vs Allowed) */}
                      {isProtected ? (
                        <div
                          className="flex items-center gap-1 text-[11px] font-medium text-stone-400 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 select-none cursor-not-allowed"
                          title={albums.length <= 1 ? "At least one album must remain in the wedding portal" : "The primary core wedding celebration album cannot be deleted"}
                        >
                          <Lock className="w-3 h-3 text-stone-400" />
                          <span>Cannot Delete</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isDeletingAlbumId === album.id}
                          onClick={() => handleDeleteAlbum(album)}
                          className="px-2 py-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50"
                          title="Delete this album"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STANDARD GALLERY VIEW                                    */
          /* ======================================================== */
          <>
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Memories & Celebrations</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
            style={{
              fontFamily: headingFont,
              color: theme.colors.textHeading,
            }}
          >
            Wedding Photo Gallery
          </h2>

          <p
            className="text-xs sm:text-sm leading-relaxed"
            style={{
              fontFamily: bodyFont,
              color: theme.colors.textMuted || '#78716c',
            }}
          >
            Browse moments from each ceremony, relive sacred rituals, and contribute your own candid memories to the couple&apos;s digital keepsake album.
          </p>

          {/* Action CTAs: Upload Photos (if allowed) & Create Album (Admin Only) */}
          {(canUploadPhotos || canCreateAlbum) && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {canUploadPhotos && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="group px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-stone-900 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                    boxShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <Camera className="w-4 h-4 text-stone-950 group-hover:rotate-12 transition-transform" />
                  <span>Upload Photos</span>
                </button>
              )}

              {canCreateAlbum && (
                <button
                  onClick={() => setIsNewAlbumModalOpen(true)}
                  className="px-4 py-2.5 rounded-full font-semibold text-xs sm:text-sm border transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer backdrop-blur-xs"
                  style={{
                    borderColor: theme.colors.goldOrMetallic || '#D4AF37',
                    color: theme.colors.textHeading,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>Create Album</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Album Selector Filter Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none justify-start sm:justify-center">
            {/* All Photos Pill */}
            <button
              onClick={() => setSelectedAlbumId('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                selectedAlbumId === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-transparent'
              }`}
            >
              <span>All Moments</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedAlbumId === 'all' ? 'bg-amber-950 text-amber-200' : 'bg-black/10 dark:bg-white/10'
              }`}>
                {photos.length}
              </span>
            </button>

            {/* Individual Album Pills */}
            {albums.map((album) => {
              const albumCount = photos.filter((p) => p.albumId === album.id).length;
              const isSelected = selectedAlbumId === album.id;
              return (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-transparent'
                  }`}
                >
                  <span>{album.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-amber-950 text-amber-200' : 'bg-black/10 dark:bg-white/10'
                  }`}>
                    {albumCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Album Subtitle Banner */}
          {currentAlbum && (
            <div className="mt-3 text-center space-y-1.5">
              {currentAlbum.description && (
                <p className="text-xs sm:text-sm italic text-stone-500 dark:text-stone-400">
                  &ldquo;{currentAlbum.description}&rdquo;
                </p>
              )}
              {currentAlbum.uploaderName && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 block mt-0.5">
                  Curated by {currentAlbum.uploaderName}
                </span>
              )}

              {/* Admin Quick Action Controls for Selected Album */}
              {isAdmin && (
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-stone-500 font-medium">
                    {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} in this album
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStartEditAlbum(currentAlbum)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-amber-600" />
                    <span>Rename / Edit</span>
                  </button>

                  {isAlbumProtected(currentAlbum, albums.length) ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 select-none"
                      title={albums.length <= 1 ? "At least one album must remain in the wedding portal" : "Primary core wedding celebration album cannot be deleted"}
                    >
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>{albums.length <= 1 ? 'Protected (Last Album)' : 'Core Album (Protected)'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isDeletingAlbumId === currentAlbum.id}
                      onClick={() => handleDeleteAlbum(currentAlbum)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Album</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredPhotos.map((photo, index) => {
              const album = albums.find((a) => a.id === photo.albumId);
              const isLiked = likedPhotoIds.has(photo.id);
              const likes = (photo.likesCount || 0) + (isLiked ? 1 : 0);

              return (
                <div
                  key={photo.id}
                  onClick={() => openLightbox(index)}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-md cursor-pointer bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  {/* Photo Image */}
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Wedding celebration photo'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3" />

                  {/* Top Badges (Visible on hover) */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-300/40">
                      {album ? album.title : 'Photo'}
                    </span>
                    <button
                      onClick={(e) => handleLikePhoto(e, photo.id)}
                      className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                        isLiked
                          ? 'bg-rose-500 text-white scale-110'
                          : 'bg-black/50 text-white hover:bg-rose-500 hover:text-white'
                      }`}
                      title="Heart this photo"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Bottom Info (Visible on hover) */}
                  <div className="absolute bottom-2.5 inset-x-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 space-y-1">
                    {photo.caption && (
                      <p className="text-xs font-semibold line-clamp-2 drop-shadow-sm">
                        {photo.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-stone-300">
                      <span className="truncate">By {photo.uploaderName || 'Guest'}</span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                        <span>{likes}</span>
                      </span>
                    </div>
                  </div>

                  {/* Subtle always-visible Heart badge in bottom-right on mobile */}
                  <div className="sm:hidden absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[10px] text-white flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                    <span>{likes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-700 dark:text-stone-300">
              No photos in this album yet
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
              Be the first to upload photos from this celebration for everyone to admire!
            </p>
            {canUploadPhotos && (
              <button
                onClick={() => {
                  if (selectedAlbumId !== 'all') {
                    setUploadAlbumId(selectedAlbumId);
                  }
                  setIsUploadModalOpen(true);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload to this album</span>
              </button>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {activeLightboxIndex !== null && filteredPhotos[activeLightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-300">
          {/* Lightbox Top Bar */}
          <div className="flex items-center justify-between text-white z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-amber-300">
                {activeLightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-xs sm:text-sm text-stone-300 truncate max-w-xs sm:max-w-md">
                {albums.find((a) => a.id === filteredPhotos[activeLightboxIndex].albumId)?.title || 'Photo'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Like Button */}
              <button
                onClick={(e) => handleLikePhoto(e, filteredPhotos[activeLightboxIndex].id)}
                className={`p-2 rounded-full backdrop-blur-md border border-white/20 transition-all ${
                  likedPhotoIds.has(filteredPhotos[activeLightboxIndex].id)
                    ? 'bg-rose-600 text-white scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Heart this photo"
              >
                <Heart className={`w-4 h-4 ${likedPhotoIds.has(filteredPhotos[activeLightboxIndex].id) ? 'fill-current' : ''}`} />
              </button>

              {/* Download Photo */}
              <a
                href={filteredPhotos[activeLightboxIndex].url}
                download={`wedding-photo-${filteredPhotos[activeLightboxIndex].id}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
                title="Download original photo"
              >
                <Download className="w-4 h-4" />
              </a>

              {/* Delete (if admin) */}
              {isAdmin && (
                <button
                  onClick={(e) => handleDeletePhoto(e, filteredPhotos[activeLightboxIndex].id)}
                  className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                  title="Delete photo (Host action)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Close Lightbox */}
              <button
                onClick={closeLightbox}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer ml-1"
                title="Close lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Stage with Prev/Next Controls */}
          <div className="relative flex-1 flex items-center justify-center py-2 sm:py-4">
            {/* Prev Arrow */}
            {filteredPhotos.length > 1 && (
              <button
                onClick={prevLightboxPhoto}
                className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all active:scale-95 cursor-pointer"
                title="Previous photo (Left arrow)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* High-res Image */}
            <div className="relative max-w-4xl max-h-[75vh] sm:max-h-[80vh] flex items-center justify-center overflow-hidden rounded-xl">
              <img
                src={filteredPhotos[activeLightboxIndex].url}
                alt={filteredPhotos[activeLightboxIndex].caption || 'Wedding photo'}
                className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Next Arrow */}
            {filteredPhotos.length > 1 && (
              <button
                onClick={nextLightboxPhoto}
                className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all active:scale-95 cursor-pointer"
                title="Next photo (Right arrow)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Caption Bar */}
          <div className="text-center text-white space-y-1 z-20 max-w-xl mx-auto pb-2">
            {filteredPhotos[activeLightboxIndex].caption && (
              <p className="text-sm sm:text-base font-medium drop-shadow-md">
                {filteredPhotos[activeLightboxIndex].caption}
              </p>
            )}
            <p className="text-xs text-stone-400">
              Shared by <span className="text-amber-300 font-semibold">{filteredPhotos[activeLightboxIndex].uploaderName || 'Guest'}</span>
              {filteredPhotos[activeLightboxIndex].likesCount ? ` • ❤️ ${filteredPhotos[activeLightboxIndex].likesCount + (likedPhotoIds.has(filteredPhotos[activeLightboxIndex].id) ? 1 : 0)} hearts` : ''}
            </p>
          </div>
        </div>
      )}

      {/* UPLOAD PHOTOS MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.goldOrMetallic || '#D4AF37',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: theme.colors.textHeading, fontFamily: headingFont }}>
                Upload Celebration Photos
              </h3>
              <p className="text-xs text-stone-500">
                Share your snapshots from the festivities with the couple and guests!
              </p>
            </div>

            {uploadSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                  {uploadSuccessMsg}
                </p>
                <p className="text-xs text-stone-500">
                  Your photo is now live in the wedding album!
                </p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                    Select Images
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-400/50 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                  >
                    <Camera className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300">
                      Click to browse or drag photos here
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Supports JPG, PNG, WEBP (multiple photos allowed)
                    </p>
                  </div>
                </div>

                {/* Previews */}
                {selectedFiles.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-300 block mb-2">
                      Selected ({selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}):
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedFiles.map((item, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-amber-300 shadow-sm">
                          <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFileFromUpload(idx)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Album Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1.5">
                    Save to Album
                  </label>
                  <select
                    value={uploadAlbumId}
                    onChange={(e) => setUploadAlbumId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        📁 {album.title}
                      </option>
                    ))}
                    {canCreateAlbum && (
                      <option value="__new__">✨ + Create a New Album...</option>
                    )}
                  </select>
                </div>

                {/* Inline New Album Title if selected (Admin Only) */}
                {canCreateAlbum && uploadAlbumId === '__new__' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                      New Album Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mehndi Afternoon or Late Night Dancing"
                      value={newAlbumTitleForUpload}
                      onChange={(e) => setNewAlbumTitleForUpload(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-400 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm"
                    />
                  </div>
                )}

                {/* Uploader Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Your Name / Family Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Farhan & Zoya or Auntie Fatima"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>

                {/* Caption / Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Caption or Sweet Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. The warmest smiles on the dance floor!"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUploading || selectedFiles.length === 0}
                    className="w-full py-3 rounded-full font-bold text-sm text-stone-900 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                    }}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Uploading Photo(s)...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>Post Photo(s) to Gallery</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE ALBUM MODAL (Admin Only) */}
      {canCreateAlbum && isNewAlbumModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-200"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.goldOrMetallic || '#D4AF37',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsNewAlbumModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <FolderPlus className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: theme.colors.textHeading, fontFamily: headingFont }}>
                Create New Photo Album
              </h3>
              <p className="text-xs text-stone-500">
                Organize memories into custom albums for ceremonies, afterparties, or candids.
              </p>
            </div>

            <form onSubmit={handleCreateAlbumSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sangeet Performances or Rooftop Afterparty"
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Description / Memory (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="A few words about this ceremony or celebration..."
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Created By (Your Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Couple, or Aisha"
                  value={newAlbumCreator}
                  onChange={(e) => setNewAlbumCreator(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreatingAlbum || !newAlbumTitle.trim()}
                  className="w-full py-3 rounded-full font-bold text-sm text-stone-900 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  }}
                >
                  {isCreatingAlbum ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating Album...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>Create Album</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* RENAME / EDIT ALBUM MODAL (Admin Only) */}
      {isAdmin && editingAlbum && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div
            className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-200"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.goldOrMetallic || '#D4AF37',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setEditingAlbum(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: theme.colors.textHeading, fontFamily: headingFont }}>
                Rename Album
              </h3>
              <p className="text-xs text-stone-500">
                Update the title and memory description for this celebration album.
              </p>
            </div>

            <form onSubmit={handleSaveAlbumEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Album Title *
                </label>
                <input
                  type="text"
                  value={editAlbumTitle}
                  onChange={(e) => setEditAlbumTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                  Description / Memory (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editAlbumDesc}
                  onChange={(e) => setEditAlbumDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAlbum(null)}
                  className="flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAlbumEdit || !editAlbumTitle.trim()}
                  className="flex-1 py-2.5 rounded-full font-bold text-xs sm:text-sm text-stone-900 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
                  }}
                >
                  {isSavingAlbumEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
