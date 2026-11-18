import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { INITIAL_WEDDING_PROJECT } from '../src/data/initialData';
import { WeddingProject, RSVPResponse, InvitationLink } from '../src/types/wedding';
import { getEffectiveShareMetadata } from '../src/services/shareMetadata';

export interface AdminAuthRecord {
  username: string;
  password: string;
  passwordHint: string;
  showHintOnLoginPage: boolean;
  lastUpdated?: string;
}

// Global error handlers for database initialization phase
if (!process.listenerCount('uncaughtException')) {
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception during startup:', err);
  });
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'wedding_portal.sqlite');

// Ensure data directory exists with full permissions
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o777 });
  }
} catch (dirErr) {
  console.error(`[Database] Warning: Could not ensure data directory ${DATA_DIR}:`, dirErr);
}

console.log(`[Database] Connecting to SQLite database at: ${DB_PATH}`);

// Initialize SQLite database instance with informative error reporting
let dbInstance: InstanceType<typeof Database>;
try {
  dbInstance = new Database(DB_PATH, { timeout: 10000 });
  console.log('[Database] SQLite connection established successfully');
} catch (dbErr) {
  console.error(`[Database] FATAL: Unable to open SQLite database at ${DB_PATH}:`, dbErr);
  console.error('[Database] Details:', dbErr instanceof Error ? dbErr.stack : String(dbErr));
  throw dbErr;
}

export const sqlite = dbInstance;

// Configure journal mode with fallback for Docker volumes / network filesystems (NFS/CIFS)
try {
  const currentMode = sqlite.pragma('journal_mode = WAL', { simple: true });
  console.log(`[Database] SQLite journal mode configured: ${currentMode}`);
} catch (walErr) {
  console.warn('[Database] WAL mode failed on volume (common on NFS/CIFS), falling back to standard journal:', walErr);
  sqlite.pragma('journal_mode = DELETE');
}

sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('busy_timeout = 5000');

// Initialize schema tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS project_state (
    id TEXT PRIMARY KEY,
    project_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_auth (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    password_hint TEXT,
    show_hint INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id TEXT PRIMARY KEY,
    link_code TEXT,
    guest_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    data_json TEXT NOT NULL,
    submitted_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS link_views (
    link_code TEXT PRIMARY KEY,
    views_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    ip TEXT,
    created_at TEXT NOT NULL
  );
`);

export interface ServerActivityLog {
  id: string;
  category: 'DATA_SAVE' | 'GUEST_OPEN' | 'RSVP' | 'AUTH' | 'SYSTEM';
  title: string;
  details: string;
  ip?: string;
  createdAt: string;
}

/**
 * Logs an activity both to the server stdout (for terminal & Docker logs)
 * and persists to the SQLite database for the Admin Log Viewer.
 */
export function logActivity(category: ServerActivityLog['category'], title: string, details: string, ip?: string): void {
  const id = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString();

  // Print prominent formatted console output for Docker/CasaOS terminal
  const divider = '═'.repeat(72);
  console.log(`\n${divider}`);
  console.log(`[WEDDING SERVER] 🔔 [${timeStr}] [${category}] ${title}`);
  console.log(`[WEDDING SERVER] 📝 Details: ${details}`);
  if (ip) console.log(`[WEDDING SERVER] 🌐 Client IP: ${ip}`);
  console.log(`${divider}\n`);

  try {
    sqlite.prepare(`
      INSERT INTO activity_logs (id, category, title, details, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, category, title, details, ip || '', now);

    // Keep only the latest 200 logs
    sqlite.prepare(`
      DELETE FROM activity_logs WHERE id NOT IN (
        SELECT id FROM activity_logs ORDER BY created_at DESC LIMIT 200
      )
    `).run();
  } catch (err) {
    console.warn('Could not insert activity log to SQLite:', err);
  }
}

export function getActivityLogsFromDB(limit = 50): ServerActivityLog[] {
  try {
    const rows = sqlite.prepare(`
      SELECT id, category, title, details, ip, created_at as createdAt
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as ServerActivityLog[];
    return rows;
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    return [];
  }
}

// Callbacks for live notifications (SSE broadcasting)
type ProjectChangeCallback = (project: WeddingProject) => void;
const changeListeners = new Set<ProjectChangeCallback>();

export function onProjectChange(callback: ProjectChangeCallback): () => void {
  changeListeners.add(callback);
  return () => changeListeners.delete(callback);
}

function broadcastChange(project: WeddingProject): void {
  for (const listener of changeListeners) {
    try {
      listener(project);
    } catch (err) {
      console.warn('Error in change listener:', err);
    }
  }
}

// Migrate data from existing JSON file if present, or initialize with defaults
function initializeDatabase(): void {
  const existingRow = sqlite.prepare('SELECT id FROM project_state WHERE id = ?').get('main');
  
  if (!existingRow) {
    let initialProject: WeddingProject = INITIAL_WEDDING_PROJECT;
    let initialAuth: AdminAuthRecord = {
      username: 'admin',
      password: 'wedding2025',
      passwordHint: 'Default demo password is wedding2025',
      showHintOnLoginPage: true,
      lastUpdated: new Date().toISOString(),
    };

    // Check for previous database JSON file to preserve user edits
    const legacyFile = path.join(DATA_DIR, 'wedding_database.json');
    if (fs.existsSync(legacyFile)) {
      try {
        const raw = fs.readFileSync(legacyFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.project && parsed.project.couple) {
          initialProject = {
            ...INITIAL_WEDDING_PROJECT,
            ...parsed.project,
            couple: {
              ...INITIAL_WEDDING_PROJECT.couple,
              ...parsed.project.couple,
            },
          };
        }
        if (parsed && parsed.auth && parsed.auth.username) {
          initialAuth = {
            ...initialAuth,
            ...parsed.auth,
          };
        }
      } catch (err) {
        console.warn('Legacy JSON migration warning:', err);
      }
    }

    const now = new Date().toISOString();
    initialProject.updatedAt = now;
    initialProject.version = 1;

    const insertProject = sqlite.prepare(`
      INSERT INTO project_state (id, project_json, version, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    insertProject.run('main', JSON.stringify(initialProject), 1, now);

    const insertAuth = sqlite.prepare(`
      INSERT INTO admin_auth (id, username, password, password_hint, show_hint, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAuth.run(
      'main',
      initialAuth.username,
      initialAuth.password,
      initialAuth.passwordHint,
      initialAuth.showHintOnLoginPage ? 1 : 0,
      now
    );

    // Seed initial RSVPs if any
    if (initialProject.rsvps && initialProject.rsvps.length > 0) {
      const insertRsvp = sqlite.prepare(`
        INSERT OR REPLACE INTO rsvps (id, link_code, guest_name, email, phone, status, guest_count, data_json, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const rsvp of initialProject.rsvps) {
        insertRsvp.run(
          rsvp.id,
          rsvp.linkCode || '3',
          rsvp.guestName,
          rsvp.email,
          rsvp.phone || '',
          rsvp.status,
          rsvp.guestCount || 1,
          JSON.stringify(rsvp),
          rsvp.submittedAt || now
        );
      }
    }
  }
}

initializeDatabase();

/**
 * Get the current wedding project from the SQLite database
 */
export function getProjectFromDB(): WeddingProject {
  const row = sqlite.prepare('SELECT project_json, version, updated_at FROM project_state WHERE id = ?').get('main') as {
    project_json: string;
    version: number;
    updated_at: string;
  } | undefined;

  if (!row) {
    initializeDatabase();
    return getProjectFromDB();
  }

  try {
    const project: WeddingProject = JSON.parse(row.project_json);
    project.version = row.version;
    project.updatedAt = row.updated_at;

    // Synchronize latest RSVPs from relational rsvps table
    const rsvpRows = sqlite.prepare('SELECT data_json FROM rsvps ORDER BY submitted_at DESC').all() as { data_json: string }[];
    project.rsvps = rsvpRows.map((r) => JSON.parse(r.data_json));

    // Synchronize link view counts
    const viewRows = sqlite.prepare('SELECT link_code, views_count FROM link_views').all() as { link_code: string; views_count: number }[];
    const viewMap = new Map<string, number>();
    for (const v of viewRows) {
      viewMap.set(v.link_code, v.views_count);
    }

    // Synchronize event dates with formattedDate if needed
    if (project.events) {
      project.events = project.events.map((e) => {
        let resolvedDate = e.date;
        if (e.formattedDate) {
          const parsed = new Date(e.formattedDate);
          if (!isNaN(parsed.getTime())) {
            const y = String(parsed.getFullYear());
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            resolvedDate = `${y}-${m}-${d}`;
          }
        }
        return { ...e, date: resolvedDate || e.date };
      });
    }

    if (project.invitationLinks) {
      project.invitationLinks = project.invitationLinks.map((link) => {
        const effectiveMeta = getEffectiveShareMetadata(link, project);
        return {
          ...link,
          maxGuests: link.maxGuests ?? project.maxGuestsPerRsvp ?? 3,
          viewsCount: viewMap.has(link.code) ? (viewMap.get(link.code) || 0) : (link.viewsCount || 0),
          sharePreview: link.sharePreview ? {
            ...effectiveMeta,
            ...link.sharePreview,
          } : effectiveMeta,
        };
      });
    }

    if (!project.sharePreview) {
      project.sharePreview = {
        title: `Wedding Celebration of ${project.couple?.formattedTitle || 'Iram & Tabish'} | 10th & 11th Oct`,
        description: `With the divine grace of the almighty, inviting you and your family to celebrate the wedding ceremonies of ${project.couple?.formattedTitle || 'Iram & Tabish'}.`,
        cardSnippet: `Wedding Celebration of ${project.couple?.formattedTitle || 'Iram & Tabish'}`,
        imageUrl: '/tabish_iram_card.jpg',
        customDomain: 'wed.tabish.in',
      };
    }

    if (!project.albums || project.albums.length === 0) {
      project.albums = INITIAL_WEDDING_PROJECT.albums || [];
    }
    if (!project.photos || project.photos.length === 0) {
      project.photos = INITIAL_WEDDING_PROJECT.photos || [];
    }
    if (project.showPhotosSection === undefined) {
      project.showPhotosSection = true;
    }

    return project;
  } catch (err) {
    console.error('Error parsing project from SQLite:', err);
    return INITIAL_WEDDING_PROJECT;
  }
}

/**
 * Save and persist the updated wedding project into SQLite
 */
export function saveProjectToDB(updatedProject: WeddingProject): WeddingProject {
  const saveTransaction = sqlite.transaction(() => {
    const currentRow = sqlite.prepare('SELECT project_json, version FROM project_state WHERE id = ?').get('main') as {
      project_json: string;
      version: number;
    } | undefined;

    const currentProject: WeddingProject = currentRow
      ? JSON.parse(currentRow.project_json)
      : INITIAL_WEDDING_PROJECT;

    const newVersion = (currentRow?.version || 1) + 1;
    const now = new Date().toISOString();

    const partner1 = (updatedProject.couple?.partner1 ?? currentProject.couple.partner1).trim();
    const partner2 = (updatedProject.couple?.partner2 ?? currentProject.couple.partner2).trim();
    const fullName1 = (updatedProject.couple?.fullName1 ?? currentProject.couple.fullName1 ?? partner1).trim();
    const fullName2 = (updatedProject.couple?.fullName2 ?? currentProject.couple.fullName2 ?? partner2).trim();

    // Smart title resolution:
    // If partner names changed, make sure formattedTitle automatically reflects them unless explicitly given a distinct new title
    let formattedTitle = updatedProject.couple?.formattedTitle?.trim();
    const prevDefaultTitle = `${currentProject.couple.partner1} & ${currentProject.couple.partner2}`;

    if (!formattedTitle || formattedTitle === currentProject.couple.formattedTitle || formattedTitle === prevDefaultTitle) {
      if (partner1 !== currentProject.couple.partner1 || partner2 !== currentProject.couple.partner2) {
        formattedTitle = `${partner1} & ${partner2}`;
      }
    }
    if (!formattedTitle) {
      formattedTitle = `${partner1} & ${partner2}`;
    }

    // Deep merge couple data ensuring all fields are preserved and updated
    const mergedProject: WeddingProject = {
      ...currentProject,
      ...updatedProject,
      couple: {
        partner1,
        partner2,
        fullName1,
        fullName2,
        formattedTitle,
      },
      announcementTitle: updatedProject.announcementTitle !== undefined ? updatedProject.announcementTitle.trim() : currentProject.announcementTitle,
      tagline: updatedProject.tagline !== undefined ? updatedProject.tagline.trim() : currentProject.tagline,
      loveStory: updatedProject.loveStory !== undefined ? updatedProject.loveStory.trim() : currentProject.loveStory,
      weddingDate: updatedProject.weddingDate ?? currentProject.weddingDate,
      weddingDateFormatted: updatedProject.weddingDateFormatted ?? currentProject.weddingDateFormatted,
      rsvpDeadlineFormatted: updatedProject.rsvpDeadlineFormatted ?? currentProject.rsvpDeadlineFormatted,
      coverImage: updatedProject.coverImage ?? currentProject.coverImage,
      selectedThemeId: updatedProject.selectedThemeId ?? currentProject.selectedThemeId,
      typography: {
        ...currentProject.typography,
        ...(updatedProject.typography || {}),
      },
      audioTrack: {
        ...currentProject.audioTrack,
        ...(updatedProject.audioTrack || {}),
      },
      contact: {
        ...currentProject.contact,
        ...(updatedProject.contact || {}),
      },
      sharePreview: updatedProject.sharePreview !== undefined ? (() => {
        let finalImageUrl = updatedProject.sharePreview.imageUrl || currentProject.sharePreview?.imageUrl || '/tabish_iram_card.jpg';
        
        // If image is a base64 data URI, write it out to public/uploads/ so WhatsApp crawler can fetch real file
        if (finalImageUrl.startsWith('data:image/')) {
          try {
            const matches = finalImageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
              const uploadsDirDist = path.resolve(process.cwd(), 'dist', 'uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }
              if (!fs.existsSync(uploadsDirDist)) {
                fs.mkdirSync(uploadsDirDist, { recursive: true });
              }
              const filename = `share_card_custom.${ext}`;
              const filePath = path.join(uploadsDir, filename);
              fs.writeFileSync(filePath, buffer);
              fs.writeFileSync(path.join(uploadsDir, 'share_card_custom.png'), buffer);
              if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
                fs.writeFileSync(path.join(uploadsDirDist, filename), buffer);
                fs.writeFileSync(path.join(uploadsDirDist, 'share_card_custom.png'), buffer);
              }
              finalImageUrl = `/uploads/${filename}`;
              console.log(`[ShareImage] Saved uploaded base64 image to ${filePath} (${buffer.length} bytes)`);
            }
          } catch (e) {
            console.error('[ShareImage] Error saving base64 image to disk:', e);
          }
        }

        return {
          title: (updatedProject.sharePreview.title ?? currentProject.sharePreview?.title ?? `Wedding Invitation of ${formattedTitle} | 10th Oct`).trim(),
          description: (updatedProject.sharePreview.description ?? currentProject.sharePreview?.description ?? '').trim(),
          cardSnippet: (updatedProject.sharePreview.cardSnippet ?? currentProject.sharePreview?.cardSnippet ?? '').trim(),
          imageUrl: finalImageUrl,
          customDomain: (updatedProject.sharePreview.customDomain ?? currentProject.sharePreview?.customDomain ?? 'wed.tabish.in').trim(),
        };
      })() : currentProject.sharePreview,
      maxGuestsPerRsvp: updatedProject.maxGuestsPerRsvp ?? currentProject.maxGuestsPerRsvp ?? 3,
      showRsvp: updatedProject.showRsvp ?? currentProject.showRsvp ?? true,
      showGiftRegistry: updatedProject.showGiftRegistry ?? currentProject.showGiftRegistry ?? true,
      showWishes: updatedProject.showWishes ?? currentProject.showWishes ?? true,
      giftRegistryUrl: updatedProject.giftRegistryUrl ?? currentProject.giftRegistryUrl,
      events: (updatedProject.events || currentProject.events || []).map((e) => {
        let resolvedDate = e.date;
        if (e.formattedDate) {
          const parsed = new Date(e.formattedDate);
          if (!isNaN(parsed.getTime())) {
            const y = String(parsed.getFullYear());
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            resolvedDate = `${y}-${m}-${d}`;
          }
        }
        return {
          ...e,
          date: resolvedDate || e.date,
        };
      }),
      invitationLinks: (updatedProject.invitationLinks || currentProject.invitationLinks || []).map((link) => {
        const fallbackProject = {
          ...currentProject,
          ...updatedProject,
          couple: { partner1, partner2, fullName1, fullName2, formattedTitle },
        };
        const effectiveMeta = getEffectiveShareMetadata(link, fallbackProject);
        return {
          ...link,
          maxGuests: link.maxGuests ?? updatedProject.maxGuestsPerRsvp ?? currentProject.maxGuestsPerRsvp ?? 3,
          sharePreview: link.sharePreview ? {
            ...effectiveMeta,
            ...link.sharePreview,
          } : effectiveMeta,
        };
      }),
      rsvps: updatedProject.rsvps || currentProject.rsvps || [],
      version: newVersion,
      updatedAt: now,
    };

    sqlite.prepare(`
      UPDATE project_state
      SET project_json = ?, version = ?, updated_at = ?
      WHERE id = 'main'
    `).run(JSON.stringify(mergedProject), newVersion, now);

    // Record server log
    logActivity(
      'DATA_SAVE',
      `Wedding Project Updated (v${newVersion})`,
      `Couple: "${formattedTitle}" (Bride: ${partner1}, Groom: ${partner2}) | Date: "${mergedProject.weddingDateFormatted}" | Theme: ${mergedProject.selectedThemeId}`
    );

    // Keep JSON file backups in sync for persistence safety
    try {
      fs.writeFileSync(
        path.join(DATA_DIR, 'wedding_database.json'),
        JSON.stringify({ version: newVersion, lastUpdated: now, project: mergedProject }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(DATA_DIR, 'wedding-project.json'),
        JSON.stringify(mergedProject, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.warn('Backup JSON write warning:', e);
    }

    return mergedProject;
  });

  const result = saveTransaction();
  broadcastChange(result);
  return result;
}

/**
 * Insert a new RSVP into SQLite database
 */
export function insertRSVPToDB(rsvp: Omit<RSVPResponse, 'id' | 'submittedAt'>, ip?: string): { newRSVP: RSVPResponse; project: WeddingProject } {
  const insertTransaction = sqlite.transaction(() => {
    const rawStatus = (rsvp as any).status || ((rsvp as any).attending ? 'attending' : 'declined');
    const status: 'attending' | 'declined' | 'tentative' = 
      rawStatus === 'declined' ? 'declined' : rawStatus === 'tentative' ? 'tentative' : 'attending';

    const newRSVP: RSVPResponse = {
      linkCode: rsvp.linkCode || '3',
      linkType: rsvp.linkType || 'wedding_reception',
      guestName: rsvp.guestName?.trim() || 'Guest',
      email: rsvp.email?.trim() || '',
      phone: rsvp.phone?.trim() || '',
      attendingEventIds: rsvp.attendingEventIds || [],
      guestCount: Math.max(1, Number(rsvp.guestCount) || 1),
      dietaryRequirements: rsvp.dietaryRequirements || (rsvp as any).dietaryRestrictions || '',
      songRequest: rsvp.songRequest || '',
      messageToCouple: rsvp.messageToCouple || (rsvp as any).notes || '',
      ...rsvp,
      status,
      id: 'rsvp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      submittedAt: new Date().toISOString(),
    };

    sqlite.prepare(`
      INSERT INTO rsvps (id, link_code, guest_name, email, phone, status, guest_count, data_json, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newRSVP.id,
      newRSVP.linkCode || '3',
      newRSVP.guestName,
      newRSVP.email,
      newRSVP.phone || '',
      newRSVP.status,
      newRSVP.guestCount || 1,
      JSON.stringify(newRSVP),
      newRSVP.submittedAt
    );

    const project = getProjectFromDB();

    logActivity(
      'RSVP',
      `RSVP Submitted for ?invite=${newRSVP.linkCode}`,
      `Guest: "${newRSVP.guestName}" | Status: ${newRSVP.status.toUpperCase()} (${newRSVP.guestCount} guest(s)) | Note: ${newRSVP.messageToCouple || 'None'}`,
      ip
    );

    return { newRSVP, project };
  });

  const result = insertTransaction();
  broadcastChange(result.project);
  return result;
}

/**
 * Increment view count for a specific invitation link in SQLite database and log guest access
 */
export function recordLinkViewInDB(linkCode: string, ip?: string, referer?: string): number {
  const normalized = linkCode.trim().toLowerCase();
  const now = new Date().toISOString();

  sqlite.prepare(`
    INSERT INTO link_views (link_code, views_count, updated_at)
    VALUES (?, 1, ?)
    ON CONFLICT(link_code) DO UPDATE SET
      views_count = views_count + 1,
      updated_at = excluded.updated_at
  `).run(normalized, now);

  const row = sqlite.prepare('SELECT views_count FROM link_views WHERE link_code = ?').get(normalized) as { views_count: number } | undefined;
  const count = row?.views_count || 1;

  // Retrieve project link title
  let linkDesc = `Link ?invite=${linkCode}`;
  try {
    const project = getProjectFromDB();
    const link = project.invitationLinks?.find(l => l.code === linkCode || l.code.toLowerCase() === normalized);
    if (link) {
      linkDesc = `"${link.title}" (${link.type})`;
    }
  } catch (_) {}

  logActivity(
    'GUEST_OPEN',
    `Guest Opened Invitation URL (?invite=${linkCode})`,
    `Link: ${linkDesc} | Total Visits: ${count}${referer ? ` | Ref: ${referer}` : ''}`,
    ip
  );

  return count;
}

/**
 * Reset project in SQLite database back to initial defaults
 */
export function resetProjectInDB(): WeddingProject {
  const resetTransaction = sqlite.transaction(() => {
    const now = new Date().toISOString();
    const defaultProject: WeddingProject = {
      ...INITIAL_WEDDING_PROJECT,
      version: 1,
      updatedAt: now,
    };

    sqlite.prepare(`
      UPDATE project_state
      SET project_json = ?, version = 1, updated_at = ?
      WHERE id = 'main'
    `).run(JSON.stringify(defaultProject), now);

    sqlite.prepare('DELETE FROM rsvps').run();
    sqlite.prepare('DELETE FROM link_views').run();

    if (defaultProject.rsvps && defaultProject.rsvps.length > 0) {
      const insertRsvp = sqlite.prepare(`
        INSERT INTO rsvps (id, link_code, guest_name, email, phone, status, guest_count, data_json, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const rsvp of defaultProject.rsvps) {
        insertRsvp.run(
          rsvp.id,
          rsvp.linkCode || '3',
          rsvp.guestName,
          rsvp.email,
          rsvp.phone || '',
          rsvp.status,
          rsvp.guestCount || 1,
          JSON.stringify(rsvp),
          rsvp.submittedAt || now
        );
      }
    }

    try {
      fs.writeFileSync(
        path.join(DATA_DIR, 'wedding_database.json'),
        JSON.stringify({ version: 1, lastUpdated: now, project: defaultProject }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(DATA_DIR, 'wedding-project.json'),
        JSON.stringify(defaultProject, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.warn('Backup JSON write warning on reset:', e);
    }

    return defaultProject;
  });

  const result = resetTransaction();
  broadcastChange(result);
  return result;
}

/**
 * Get Admin Credentials from SQLite database
 */
export function getAdminAuthFromDB(): AdminAuthRecord {
  const row = sqlite.prepare('SELECT username, password, password_hint, show_hint, updated_at FROM admin_auth WHERE id = ?').get('main') as {
    username: string;
    password: string;
    password_hint: string;
    show_hint: number;
    updated_at: string;
  } | undefined;

  if (!row) {
    return {
      username: 'admin',
      password: 'wedding2025',
      passwordHint: 'Default demo password is wedding2025',
      showHintOnLoginPage: true,
    };
  }

  return {
    username: row.username,
    password: row.password,
    passwordHint: row.password_hint || '',
    showHintOnLoginPage: row.show_hint === 1,
    lastUpdated: row.updated_at,
  };
}

/**
 * Save Admin Credentials to SQLite database
 */
export function saveAdminAuthToDB(auth: Partial<AdminAuthRecord>): AdminAuthRecord {
  const current = getAdminAuthFromDB();
  const updated: AdminAuthRecord = {
    ...current,
    ...auth,
    lastUpdated: new Date().toISOString(),
  };

  sqlite.prepare(`
    UPDATE admin_auth
    SET username = ?, password = ?, password_hint = ?, show_hint = ?, updated_at = ?
    WHERE id = 'main'
  `).run(
    updated.username,
    updated.password,
    updated.passwordHint,
    updated.showHintOnLoginPage ? 1 : 0,
    updated.lastUpdated
  );

  return updated;
}
