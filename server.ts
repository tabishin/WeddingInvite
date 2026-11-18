import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  getProjectFromDB,
  saveProjectToDB,
  insertRSVPToDB,
  recordLinkViewInDB,
  resetProjectInDB,
  getAdminAuthFromDB,
  saveAdminAuthToDB,
  onProjectChange,
  getActivityLogsFromDB,
  logActivity,
} from './server/db';
import { WeddingProject, WeddingPhoto, PhotoAlbum } from './src/types/wedding';
import { getEffectiveShareMetadata, resolveLinkFromUrl } from './src/services/shareMetadata';

// Early process error diagnostics for Docker / Portainer logs
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

// Clean signal handling for Docker containers
process.on('SIGTERM', () => {
  console.log('[Shutdown] Received SIGTERM signal. Gracefully exiting...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Shutdown] Received SIGINT signal. Gracefully exiting...');
  process.exit(0);
});

const app = express();
const isDev = process.env.NODE_ENV !== 'production';
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;

// In development, AI Studio dev server environment must run on port 3000.
// In production (Docker, Portainer, self-hosted), PORT from environment is honored.
const PORT = cliPort || (isDev ? 3000 : (envPort || 3000));

console.log('====================================================');
console.log('  Wedding Invitation Portal (VowPortal) Starting   ');
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Process ID:  ${process.pid}`);
console.log(`  Target Port: ${PORT}`);
console.log('====================================================');

app.use(express.json({ limit: '10mb' }));

// Concise HTTP request logging for instant Docker/Portainer diagnostics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // Avoid logging noisy health checks to keep logs clean
    if (req.path !== '/health' && req.path !== '/api/health') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Middleware for CORS and strict no-cache on database endpoints
const apiHeadersMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma, Expires, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
};

app.use('/api', apiHeadersMiddleware);

// --- SSE Real-Time Streaming Subscriptions ---
const sseClients = new Set<express.Response>();

// Register SQLite project change listener to push updates to all active browsers in real time
onProjectChange((updatedProject: WeddingProject) => {
  const payload = `data: ${JSON.stringify(updatedProject)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
});

// SSE endpoint for live multi-device and multi-browser instant sync
app.get('/api/project/stream', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Immediately send initial snapshot upon connection
  try {
    const currentProject = getProjectFromDB();
    res.write(`data: ${JSON.stringify(currentProject)}\n\n`);
  } catch (err) {
    console.error('Error sending initial project to SSE client:', err);
  }

  sseClients.add(res);

  // Periodic heartbeat every 20 seconds to prevent reverse-proxy timeout disconnects
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// --- API Database Endpoints ---

// 1. Health check & DB status (supports both /health and /api/health)
const healthHandler = (req: express.Request, res: express.Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Connection', 'close');
  res.status(200).json({ 
    status: 'ok', 
    database: 'sqlite-better-sqlite3', 
    connectedClients: sseClients.size,
    timestamp: new Date().toISOString() 
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 2. GET Wedding Project (Single Source of Truth from SQLite DB)
app.get('/api/project', (req, res) => {
  try {
    const project = getProjectFromDB();
    const invite = req.query._invite;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (invite) {
      console.log(`[WEDDING SERVER] 📥 GET /api/project (Guest view ?invite=${invite}, IP: ${clientIp}) -> Serving Couple: "${project.couple.formattedTitle}" (v${project.version})`);
    }
    res.json(project);
  } catch (err) {
    console.error('Database read error:', err);
    res.status(500).json({ error: 'Failed to read wedding project from database' });
  }
});

// 3. POST Save Wedding Project (Admin updates Couple, Theme, Events, Typography, Links)
app.post('/api/project', (req, res) => {
  const updatedProject = req.body;
  if (!updatedProject || !updatedProject.couple) {
    return res.status(400).json({ error: 'Invalid project payload' });
  }
  try {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip);
    console.log(`\n================================================================================`);
    console.log(`[WEDDING SERVER] 💾 POST /api/project RECEIVED from IP: ${clientIp}`);
    console.log(`[WEDDING SERVER] 💍 Couple Payload: Bride="${updatedProject.couple.partner1}", Groom="${updatedProject.couple.partner2}", FormattedTitle="${updatedProject.couple.formattedTitle}"`);
    console.log(`[WEDDING SERVER] 🎨 Theme: "${updatedProject.selectedThemeId}", Date: "${updatedProject.weddingDateFormatted}"`);
    
    const savedProject = saveProjectToDB(updatedProject);
    
    console.log(`[WEDDING SERVER] ✅ SQLite Commit Success! Version: ${savedProject.version}`);
    console.log(`[WEDDING SERVER] 💍 Active Display Title: "${savedProject.couple.formattedTitle}"`);
    console.log(`[WEDDING SERVER] ⚡ Live SSE Broadcast dispatched to ${sseClients.size} connected device(s)`);
    console.log(`================================================================================\n`);
    
    res.json({ success: true, project: savedProject });
  } catch (err) {
    console.error('Database write error:', err);
    res.status(500).json({ error: 'Failed to write wedding project to database' });
  }
});

// 4. Submit RSVP directly to database
app.post('/api/project/rsvp', (req, res) => {
  const { rsvp } = req.body;
  if (!rsvp || !rsvp.guestName) {
    return res.status(400).json({ error: 'Missing RSVP details' });
  }
  try {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip);
    const result = insertRSVPToDB(rsvp, clientIp);
    res.json({ success: true, newRSVP: result.newRSVP, project: result.project });
  } catch (err) {
    console.error('RSVP DB insert error:', err);
    res.status(500).json({ error: 'Failed to record RSVP in database' });
  }
});

// 5. Record Link View Counter in database (Invoked when guest opens invitation URL)
app.post('/api/project/views', (req, res) => {
  const { linkCode } = req.body;
  if (!linkCode) {
    return res.status(400).json({ error: 'Missing link code' });
  }
  try {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip);
    const referer = String(req.headers.referer || '');
    const views = recordLinkViewInDB(String(linkCode), clientIp, referer);
    res.json({ success: true, views });
  } catch (err) {
    console.error('Link view tracking error:', err);
    res.status(500).json({ error: 'Failed to update view stats in database' });
  }
});

// 5b. Activity Logs Endpoint (For Admin Activity Log Viewer)
app.get('/api/logs', (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const logs = getActivityLogsFromDB(limit);
    res.json({ logs });
  } catch (err) {
    console.error('Logs fetch error:', err);
    res.status(500).json({ error: 'Failed to read logs from database' });
  }
});

// 6. Reset Project to Factory Defaults in database
app.post('/api/project/reset', (req, res) => {
  try {
    const defaultProject = resetProjectInDB();
    res.json({ success: true, project: defaultProject });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// 7. Get Admin Auth Config from database
app.get('/api/auth/creds', (req, res) => {
  try {
    const creds = getAdminAuthFromDB();
    res.json(creds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read credentials from database' });
  }
});

// 8. Update Admin Auth Config in database
app.post('/api/auth/creds', (req, res) => {
  const { username, password, passwordHint, showHintOnLoginPage } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const updated = saveAdminAuthToDB({
      username: username.trim(),
      password: password.trim(),
      passwordHint,
      showHintOnLoginPage,
    });
    res.json({ success: true, auth: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update credentials in database' });
  }
});

// 8b. Upload custom Social Share Preview image directly
app.post('/api/upload-share-image', (req, res) => {
  try {
    const { imageBase64, dataUrl } = req.body;
    const rawData = dataUrl || imageBase64;
    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const matches = rawData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data URL' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const uploadsDirPublic = path.resolve(process.cwd(), 'public', 'uploads');
    const uploadsDirDist = path.resolve(process.cwd(), 'dist', 'uploads');
    if (!fs.existsSync(uploadsDirPublic)) {
      fs.mkdirSync(uploadsDirPublic, { recursive: true });
    }
    if (!fs.existsSync(uploadsDirDist)) {
      fs.mkdirSync(uploadsDirDist, { recursive: true });
    }

    const filename = `share_card_${Date.now()}.${ext}`;
    const filePathPublic = path.join(uploadsDirPublic, filename);
    fs.writeFileSync(filePathPublic, buffer);
    if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
      fs.writeFileSync(path.join(uploadsDirDist, filename), buffer);
    }

    // Always maintain share_card_custom in both directories for instant resolution
    fs.writeFileSync(path.join(uploadsDirPublic, `share_card_custom.${ext}`), buffer);
    fs.writeFileSync(path.join(uploadsDirPublic, 'share_card_custom.png'), buffer);
    if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
      fs.writeFileSync(path.join(uploadsDirDist, `share_card_custom.${ext}`), buffer);
      fs.writeFileSync(path.join(uploadsDirDist, 'share_card_custom.png'), buffer);
    }

    const relativeUrl = `/uploads/${filename}`;
    const linkCode = req.body.linkCode ? String(req.body.linkCode).trim() : null;
    
    // Auto-update project in DB
    const current = getProjectFromDB();
    let updatedLinks = current.invitationLinks ? [...current.invitationLinks] : [];
    if (linkCode) {
      updatedLinks = updatedLinks.map((l) => {
        if (l.code === linkCode || l.id === linkCode || l.type === linkCode) {
          return {
            ...l,
            sharePreview: {
              ...(l.sharePreview || {
                title: l.title,
                description: l.description,
                cardSnippet: '',
                customDomain: current.sharePreview?.customDomain || 'wed.tabish.in',
              }),
              imageUrl: relativeUrl,
            },
          };
        }
        return l;
      });
    }

    const updated = saveProjectToDB({
      ...current,
      invitationLinks: updatedLinks,
      sharePreview: linkCode ? current.sharePreview : {
        ...(current.sharePreview || {
          title: `Wedding Celebration of ${current.couple.formattedTitle} | 10th & 11th Oct`,
          description: '',
          customDomain: 'wed.tabish.in'
        }),
        imageUrl: relativeUrl,
      },
    });

    console.log(`[UploadShareImage] Saved custom share image to ${filePathPublic} (${buffer.length} bytes)${linkCode ? ` for link "${linkCode}"` : ''}`);
    res.json({ success: true, imageUrl: relativeUrl, project: updated });
  } catch (err) {
    console.error('Failed to upload share image:', err);
    res.status(500).json({ error: 'Failed to save share image' });
  }
});

// 8d. Photo Gallery & Album Endpoints
// Upload Photo (supports both file upload & base64 with instant SQLite sync and SSE broadcast)
app.post('/api/photos/upload', (req, res) => {
  try {
    const { imageBase64, dataUrl, albumId, caption, uploaderName, uploaderType } = req.body;
    const rawData = dataUrl || imageBase64;
    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({ error: 'Missing photo data' });
    }

    let photoUrl = rawData;
    // If base64 data URL, save to persistent uploads directory
    const matches = rawData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const photosDirPublic = path.resolve(process.cwd(), 'public', 'uploads', 'photos');
      const photosDirDist = path.resolve(process.cwd(), 'dist', 'uploads', 'photos');
      if (!fs.existsSync(photosDirPublic)) fs.mkdirSync(photosDirPublic, { recursive: true });
      if (!fs.existsSync(photosDirDist)) fs.mkdirSync(photosDirDist, { recursive: true });

      const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      fs.writeFileSync(path.join(photosDirPublic, filename), buffer);
      if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
        fs.writeFileSync(path.join(photosDirDist, filename), buffer);
      }
      photoUrl = `/uploads/photos/${filename}`;
    }

    const current = getProjectFromDB();
    if (current.allowGuestPhotoUploads === false && uploaderType !== 'couple' && uploaderType !== 'admin') {
      return res.status(403).json({ error: 'Guest photo uploads are disabled by the wedding host' });
    }
    const currentPhotos = current.photos ? [...current.photos] : [];
    const currentAlbums = current.albums ? [...current.albums] : [];

    const targetAlbumId = albumId || (currentAlbums[0]?.id || 'album-candids');

    const newPhoto: WeddingPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      albumId: targetAlbumId,
      url: photoUrl,
      caption: caption ? String(caption).trim() : '',
      uploaderName: uploaderName ? String(uploaderName).trim() : (uploaderType === 'couple' ? current.couple.formattedTitle : 'Guest'),
      uploaderType: uploaderType || 'guest',
      uploadedAt: new Date().toISOString(),
      likesCount: 1,
    };

    // Auto-assign as album cover if album has no cover photo
    const updatedAlbums = currentAlbums.map((a) => {
      if (a.id === targetAlbumId && !a.coverPhotoUrl) {
        return { ...a, coverPhotoUrl: photoUrl };
      }
      return a;
    });

    const updated = saveProjectToDB({
      ...current,
      albums: updatedAlbums,
      photos: [newPhoto, ...currentPhotos],
    });

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip);
    logActivity('DATA_SAVE', 'Photo Uploaded', `Photo uploaded by "${newPhoto.uploaderName}" to album "${targetAlbumId}"`, clientIp);

    res.json({ success: true, photo: newPhoto, project: updated });
  } catch (err) {
    console.error('Error saving uploaded photo:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Create or Update Photo Album (Admin Only)
app.post('/api/photos/album', (req, res) => {
  try {
    const { id, title, description, coverPhotoUrl, createdBy, uploaderName } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Album title is required' });
    }

    // Only host/admin can create albums; guests cannot create albums
    if (createdBy === 'guest') {
      return res.status(403).json({ error: 'Only wedding hosts and administrators can create new albums' });
    }

    const current = getProjectFromDB();
    const currentAlbums = current.albums ? [...current.albums] : [];

    const albumId = id || `album-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existingIndex = currentAlbums.findIndex((a) => a.id === albumId);

    let updatedAlbums: PhotoAlbum[];
    let targetAlbum: PhotoAlbum;

    if (existingIndex >= 0) {
      targetAlbum = {
        ...currentAlbums[existingIndex],
        title: String(title).trim(),
        description: description !== undefined ? String(description).trim() : currentAlbums[existingIndex].description,
        coverPhotoUrl: coverPhotoUrl || currentAlbums[existingIndex].coverPhotoUrl,
      };
      updatedAlbums = [...currentAlbums];
      updatedAlbums[existingIndex] = targetAlbum;
    } else {
      targetAlbum = {
        id: albumId,
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        coverPhotoUrl: coverPhotoUrl || '',
        createdAt: new Date().toISOString(),
        order: currentAlbums.length + 1,
        createdBy: createdBy || 'guest',
        uploaderName: uploaderName ? String(uploaderName).trim() : '',
      };
      updatedAlbums = [...currentAlbums, targetAlbum];
    }

    const updated = saveProjectToDB({
      ...current,
      albums: updatedAlbums,
    });

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip);
    logActivity('DATA_SAVE', 'Album Saved', `Album "${targetAlbum.title}" (${targetAlbum.id}) saved`, clientIp);

    res.json({ success: true, album: targetAlbum, project: updated });
  } catch (err) {
    console.error('Error saving album:', err);
    res.status(500).json({ error: 'Failed to save album' });
  }
});

// Delete Photo Album (Only the single core wedding album is protected, and at least 1 album must remain)
app.delete('/api/photos/album/:albumId', (req, res) => {
  try {
    const { albumId } = req.params;
    const current = getProjectFromDB();
    const currentAlbums = current.albums || [];

    if (currentAlbums.length <= 1) {
      return res.status(400).json({ error: 'At least one album must remain in the wedding portal' });
    }

    const CORE_PROTECTED_ALBUM_ID = 'album-wedding';
    const targetAlbum = currentAlbums.find((a) => a.id === albumId);

    if (albumId === CORE_PROTECTED_ALBUM_ID) {
      return res.status(403).json({ error: 'The primary core celebration album cannot be deleted' });
    }

    const updatedAlbums = currentAlbums.filter((a) => a.id !== albumId);
    const fallbackAlbum = updatedAlbums.find((a) => a.id === CORE_PROTECTED_ALBUM_ID) || updatedAlbums[0];
    const fallbackAlbumId = fallbackAlbum ? fallbackAlbum.id : CORE_PROTECTED_ALBUM_ID;

    const updatedPhotos = (current.photos || []).map((p) => {
      if (p.albumId === albumId) {
        return { ...p, albumId: fallbackAlbumId };
      }
      return p;
    });

    const updated = saveProjectToDB({
      ...current,
      albums: updatedAlbums,
      photos: updatedPhotos,
    });

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip);
    logActivity(
      'DATA_SAVE',
      'Album Deleted',
      `Album "${targetAlbum?.title || albumId}" deleted (photos preserved in "${fallbackAlbum?.title || fallbackAlbumId}")`,
      clientIp
    );

    res.json({ success: true, project: updated });
  } catch (err) {
    console.error('Error deleting album:', err);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Delete Photo
app.delete('/api/photos/:photoId', (req, res) => {
  try {
    const { photoId } = req.params;
    const current = getProjectFromDB();
    const updatedPhotos = (current.photos || []).filter((p) => p.id !== photoId);

    const updated = saveProjectToDB({
      ...current,
      photos: updatedPhotos,
    });

    res.json({ success: true, project: updated });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Like Photo
app.post('/api/photos/:photoId/like', (req, res) => {
  try {
    const { photoId } = req.params;
    const current = getProjectFromDB();
    let likedPhoto: WeddingPhoto | null = null;
    const updatedPhotos = (current.photos || []).map((p) => {
      if (p.id === photoId) {
        likedPhoto = { ...p, likesCount: (p.likesCount || 0) + 1 };
        return likedPhoto;
      }
      return p;
    });

    const updated = saveProjectToDB({
      ...current,
      photos: updatedPhotos,
    });

    res.json({ success: true, photo: likedPhoto, project: updated });
  } catch (err) {
    console.error('Error liking photo:', err);
    res.status(500).json({ error: 'Failed to like photo' });
  }
});

// 8c. Serve Binary Social Share Image with HTTP 200, proper Content-Type, Content-Length & Cache-Control
app.get(['/api/share-image', '/api/share-image.jpg', '/api/share-image.png'], (req, res) => {
  try {
    const project = getProjectFromDB();
    const matchedLink = resolveLinkFromUrl(req.originalUrl, req.query, project.invitationLinks);
    const effectiveMeta = getEffectiveShareMetadata(matchedLink, project);

    const imgUrl = effectiveMeta.imageUrl || project.sharePreview?.imageUrl || '/tabish_iram_card.jpg';

    // 1. If stored as base64 in database
    if (imgUrl.startsWith('data:image/')) {
      const matches = imgUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).end(buffer);
      }
    }

    // 2. If stored as file path
    const candidatePaths = [
      imgUrl.startsWith('/') ? path.resolve(process.cwd(), 'public', imgUrl.substring(1)) : null,
      path.resolve(process.cwd(), 'public', 'tabish_iram_card.jpg'),
      path.resolve(process.cwd(), 'public', 'wedding_share_banner.jpg'),
    ].filter(Boolean) as string[];

    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.sendFile(filePath);
      }
    }

    res.status(404).send('Share image not found');
  } catch (err) {
    console.error('Error serving share image:', err);
    res.status(500).send('Error serving image');
  }
});

// --- Helper to inject dynamic SEO and OpenGraph tags for WhatsApp & social share previews ---
function injectSeoAndSocialTags(templateHtml: string, project: WeddingProject, req: express.Request): string {
  const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();

  // Detect link from query parameters (?invite=..., ?link=..., ?code=...) or URL path
  const matchedLink = resolveLinkFromUrl(req.path, req.query, project.invitationLinks);
  const effectiveMeta = getEffectiveShareMetadata(matchedLink, project);

  const configuredDomain = effectiveMeta.customDomain?.trim() || project.sharePreview?.customDomain?.trim() || '';

  // Use incoming public host; if requested via IP/localhost with a custom domain set, fallback safely
  let host = hostHeader.split(':')[0] || configuredDomain || 'wed.tabish.in';
  if ((host === 'localhost' || host === '127.0.0.1') && configuredDomain) {
    // When running locally for testing with custom domain specified
    host = hostHeader;
  }

  let protocol = (req.headers['x-forwarded-proto'] || req.protocol || 'https') as string;
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    protocol = 'https';
  }

  const origin = `${protocol}://${hostHeader || host}`;
  const currentUrl = `${origin}${req.originalUrl}`;

  const shareTitle = effectiveMeta.title.trim();
  const fullDesc = effectiveMeta.description.trim();
  const cardSnippet = (effectiveMeta.cardSnippet || fullDesc).trim();

  // WhatsApp crawler REQUIRES a publicly reachable absolute HTTP/HTTPS URL with binary image
  const linkParam = matchedLink ? `link=${encodeURIComponent(matchedLink.code)}` : '';
  const versionParam = project.version ? `v=${project.version}` : '';
  const queryParts = [linkParam, versionParam].filter(Boolean).join('&');
  const shareImage = `${origin}/api/share-image.jpg${queryParts ? `?${queryParts}` : ''}`;

  // Escape HTML attributes safely
  const escapeAttr = (str: string) => str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeTitle = escapeAttr(shareTitle);
  const safeSnippet = escapeAttr(cardSnippet);
  const safeFullDesc = escapeAttr(fullDesc);
  const safeImage = escapeAttr(shareImage);
  const safeUrl = escapeAttr(currentUrl);

  const safeProjectJson = JSON.stringify(project).replace(/</g, '\\u003c');
  const projectInjection = `<script id="__INITIAL_WEDDING_PROJECT__">window.__INITIAL_WEDDING_PROJECT__ = ${safeProjectJson};</script>`;

  const socialTags = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeSnippet}" />
    <!-- OpenGraph / Facebook / WhatsApp Preview Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${safeTitle}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeSnippet}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:secure_url" content="${safeImage}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${safeTitle}" />
    <meta property="og:url" content="${safeUrl}" />
    <!-- Twitter / X Preview Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeSnippet}" />
    <meta name="twitter:image" content="${safeImage}" />
    <!-- Schema.org JSON-LD for Wedding Event -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "${safeTitle}",
      "description": "${safeFullDesc}",
      "startDate": "${project.weddingDate || '2026-10-24'}",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "image": ["${safeImage}"]
    }
    </script>
    ${projectInjection}
  `;

  // Replace default title and meta tags if present, or inject before </head>
  let html = templateHtml;
  html = html.replace(/<title>.*?<\/title>/gi, '');
  html = html.replace(/<meta\s+name=["']description["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:image["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:image:secure_url["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:image:type["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:image:width["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:image:height["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:image:alt["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:type["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:site_name["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:card["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:title["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:description["'][^>]*>/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/gi, '');

  return html.replace('</head>', `  ${socialTags}\n  </head>`);
}

// --- Vite Middleware / Static Serving ---
async function start() {
  const publicPath = path.resolve(process.cwd(), 'public');
  const distPath = path.resolve(process.cwd(), 'dist');
  const uploadsPublic = path.resolve(publicPath, 'uploads');
  const uploadsDist = path.resolve(distPath, 'uploads');

  if (!fs.existsSync(uploadsPublic)) fs.mkdirSync(uploadsPublic, { recursive: true });
  if (!fs.existsSync(uploadsDist)) fs.mkdirSync(uploadsDist, { recursive: true });

  // Explicit route for /uploads/* with fallback across public and dist folders
  app.use('/uploads', (req, res, next) => {
    const cleanPath = req.path.replace(/^\/+/, '');
    const candidatePaths = [
      path.resolve(uploadsPublic, cleanPath),
      path.resolve(uploadsDist, cleanPath),
      path.resolve(uploadsPublic, 'share_card_custom.png'),
      path.resolve(uploadsDist, 'share_card_custom.png'),
      path.resolve(publicPath, 'tabish_iram_card.jpg'),
      path.resolve(distPath, 'tabish_iram_card.jpg'),
      path.resolve(publicPath, 'wedding_share_banner.jpg'),
      path.resolve(distPath, 'wedding_share_banner.jpg'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        const ext = path.extname(p).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.sendFile(p);
      }
    }
    next();
  });

  // Always serve public root files (tabish_iram_card.jpg, wedding_share_banner.jpg, favicon, etc.)
  app.use(express.static(publicPath, { maxAge: '1h' }));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Intercept top-level HTML requests to inject authoritative SQLite database state & OpenGraph metadata
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
        return next();
      }

      const userAgent = String(req.headers['user-agent'] || '');
      const isSocialCrawler = /whatsapp|facebookexternalhit|twitterbot|telegrambot|slackbot|discordbot|linkedinbot/i.test(userAgent);
      const reqPath = req.path || '/';
      const hasStaticExt = path.extname(reqPath) !== '' && !reqPath.endsWith('.html');
      const isInternalVitePath = reqPath.startsWith('/@') || reqPath.startsWith('/src') || reqPath.startsWith('/node_modules');

      // If it's a social crawler OR an SPA page request, inject dynamic OpenGraph tags
      if (isSocialCrawler || (!hasStaticExt && !isInternalVitePath)) {
        try {
          const templatePath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(templatePath, 'utf-8');
          const project = getProjectFromDB();
          const enrichedHtml = injectSeoAndSocialTags(template, project, req);
          const html = await vite.transformIndexHtml(req.originalUrl, enrichedHtml);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.status(200).end(html);
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) return next();
      // If a missing asset file (e.g. .js, .css, .png, .woff2) was requested, return 404 instead of SPA HTML
      const ext = path.extname(req.path);
      if (ext && ext !== '.html') {
        return res.status(404).type('text/plain').send('Not Found');
      }
      try {
        const templatePath = path.join(distPath, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        const project = getProjectFromDB();
        const html = injectSeoAndSocialTags(template, project, req);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).send(html);
      } catch (err) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
