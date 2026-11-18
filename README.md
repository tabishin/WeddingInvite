# 💍 Wedding Invitation Portal (VowPortal)

A modern, full-stack wedding invitation and guest RSVP management platform. Designed for couples and wedding hosts who want an interactive digital invitation experience with live theme customization, multi-event itineraries, real-time RSVP tracking, celebration background music, falling petals animation, and durable SQLite database persistence.

---

## 📑 Table of Contents

- [✨ Feature Highlights](#-feature-highlights)
  - [Guest Experience](#-guest-experience)
  - [Host & Admin Studio](#-host--admin-studio)
  - [Real-Time Sync & Storage](#-real-time-sync--storage)
- [🚀 Quick Installation (Simple Terms)](#-quick-installation-simple-terms)
  - [Option 1: Quickstart with Node.js (Recommended for Beginners)](#option-1-quickstart-with-nodejs-recommended-for-beginners)
  - [Option 2: Docker Compose (Easiest Containerized Setup)](#option-2-docker-compose-easiest-containerized-setup)
  - [Option 3: Standard Docker](#option-3-standard-docker)
  - [Option 4: Production Deployment](#option-4-production-deployment)
- [🎛️ Detailed Feature Walkthrough](#️-detailed-feature-walkthrough)
  - [1. Guest Invitation Links](#1-guest-invitation-links)
  - [2. Multi-Event Itinerary & Calendar Sync](#2-multi-event-itinerary--calendar-sync)
  - [3. RSVP System & Dietary Management](#3-rsvp-system--dietary-management)
  - [4. Celebration Background Music & Autoplay](#4-celebration-background-music--autoplay)
  - [5. Gift Registry & Wishes Guestbook](#5-gift-registry--wishes-guestbook)
  - [6. Live Theme & Typography Customizer](#6-live-theme--typography-customizer)
  - [7. Falling Petals Visual Simulation](#7-falling-petals-visual-simulation)
  - [8. Real-Time Admin Dashboard](#8-real-time-admin-dashboard)
- [⚙️ Configuration & Environment Variables](#️-configuration--environment-variables)
- [📁 Project Structure](#-project-structure)
- [🔌 Backend API Endpoints](#-backend-api-endpoints)
- [🛡️ License & Credits](#️-license--credits)

---

## ✨ Feature Highlights

### 💌 Guest Experience
* **Custom Digital Invitations**: Personalized digital cards showing the couple's names, love story, date, and venue.
* **Filterable Event Access**: Specific guests can be invited to select events (e.g. Mehndi & Sangeet only, Reception only, or all festivities).
* **Multi-Event Schedule**: Clean timeline cards displaying time, venue location, Google Maps directions, and dress codes.
* **1-Click Calendar Add**: Download `.ics` files or export dates directly to Google Calendar, Apple Calendar, or Outlook.
* **Countdown Timer**: Live days, hours, minutes, and seconds countdown to the main celebration.
* **Interactive RSVP Modal**: Simple form for guests to confirm attendance, specify party size, note dietary requirements, and leave heartfelt wishes.
* **Autoplay Celebration Audio**: Romantic background soundtrack with volume control, mute toggle, and procedural harp fallback.
* **Falling Petals Animation**: Gentle romantic petal animation flowing across the invitation.
* **Mobile-First Responsive Design**: Optimized for smartphones, tablets, and desktop displays.

### 👑 Host & Admin Studio
* **Live Theme Customizer**: Real-time styling engine with pre-built aesthetic themes (Rose Gold, Royal Emerald, Classic White, Midnight Sapphire, Terracotta Sunset, Burgundy Velvet) plus custom color pickers.
* **Typography Studio**: Switch between Google Font pairings (Playfair Display, Cormorant Garamond, Cinzel, Alex Brush, Amiri, etc.) with support for both LTR and RTL scripts (Arabic, Urdu, Devanagari).
* **Schedule & Events Manager**: Create, edit, or reorder ceremonies (Haldi, Sangeet, Ceremony, Reception) with dates, times, and venue links.
* **Shareable Link Generator**: Generate unique invitation URLs and downloadable QR codes for different guest groups.
* **Guest RSVP Tracker**: Live summary of confirmed attendees, declined responses, total guest headcount, and dietary requirements.
* **Export to CSV**: Export the entire RSVP list into an Excel/CSV spreadsheet with one click.
* **Portal Feature Toggles**: Turn the Gift Registry, Wishes Guestbook, and Background Music on or off directly from the dashboard.

### ⚡ Real-Time Sync & Storage
* **Instant Multi-Device Sync**: Powered by Server-Sent Events (SSE) — when an admin updates event details or a guest RSVPs, all connected devices update instantly without a page refresh.
* **Durable SQLite Database**: Stored in `./data/wedding_portal.sqlite` with Write-Ahead Logging (WAL) enabled, preventing data corruption and allowing effortless backups.

---

## 🚀 Quick Installation (Simple Terms)

### Option 1: Quickstart with Node.js (Recommended for Beginners)

If you have Node.js installed on your computer, you can run the project in 3 simple commands:

#### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/wedding-invitation-portal.git
cd wedding-invitation-portal
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Start the app
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

### Option 2: Docker Compose (Easiest Containerized Setup)

If you have Docker installed, this starts the app, configures the reverse proxy, and mounts persistent storage automatically:

```bash
docker compose up -d
```

* **URL**: Open `http://localhost:3000` in your web browser.
* **Data Storage**: The database is stored inside a named Docker volume (`wedding_data`), so your changes and guest RSVPs persist across restarts.

To stop the app:
```bash
docker compose down
```

---

### Option 3: Standard Docker

If you prefer building and running standard Docker images:

```bash
# 1. Build the Docker image
docker build -t wedding-portal .

# 2. Run the container with a persistent volume
docker run -d \
  --name wedding_portal \
  -p 3000:3000 \
  -v wedding_data:/app/data \
  --restart unless-stopped \
  wedding-portal
```

---

### Option 4: Production Deployment

To run a standalone production build on a VPS, server, or cloud container:

```bash
# Build the client and backend bundle
npm run build

# Start the compiled production server
npm run start
```

---

## 🎛️ Detailed Feature Walkthrough

### 1. Guest Invitation Links
* **Universal Invitation Link (`/guest/all`)**: Shows the complete celebration schedule with all planned events.
* **Wedding Ceremony Link (`/guest/wedding`)**: Tailored specifically for guests attending only the main nuptial ceremony.
* **Pre-Wedding Link (`/guest/pre-wedding`)**: Focused on pre-wedding festivities like Haldi, Mehndi, and Sangeet.
* **Custom Targeted Links**: Generate new links with custom recipient names and filter which specific events they can see.

### 2. Multi-Event Itinerary & Calendar Sync
Each event item includes:
* **Event Name & Category**: Ceremony, Sangeet, Mehndi, Haldi, Reception, or Welcome Dinner.
* **Date & Timing**: Detailed start and end hours.
* **Venue Location**: Formatted address with a direct "View on Google Maps" button.
* **Dress Code / Attire Note**: Informs guests of recommended attire (e.g. Traditional Indian, Black Tie, Pastel Semi-Formal).
* **Add to Calendar**: Exports event details directly into Google Calendar or downloads an `.ics` file for Apple Calendar and Outlook.

### 3. RSVP System & Dietary Management
* **Guest Status**: Attending with joy or Respectfully declining.
* **Headcount / Additional Guests**: Specify the number of adults and children attending.
* **Dietary Preferences**: Pre-set tags (Vegetarian, Vegan, Halal, Kosher, Gluten-Free, Nut Allergies) plus a custom notes field.
* **Celebratory Wishes**: Guests can leave a congratulatory message directly for the couple.

### 4. Celebration Background Music & Autoplay
* **Autoplay on Open**: Music smoothly begins playing when the guest opens the invitation (with seamless fallback for browser autoplay permissions).
* **Curated Audio Presets**:
  * *Canon in D - Acoustic Romance* (Classic acoustic arrangement)
  * *Royal Sitar & Bansuri Harmony* (Traditional Indian classical)
  * *Romantic Harp & Chimes* (Procedural Web Audio synthesizer, works offline with zero external audio files)
* **Custom MP3 / Stream URL**: Paste any streaming link or direct MP3 file URL.
* **Admin Controls**: Toggle music on or off globally from the Admin Dashboard with one click.

### 5. Gift Registry & Wishes Guestbook
* **Nuptial Gift Registry**: Link directly to your registry wishlist (Zola, Amazon, Target, Honeyfund, etc.).
* **Wishes & Blessings Wall**: Guests can read sweet notes left by other friends and family members.
* **Independent Visibility Toggles**: You can enable or disable either card individually from the Admin Portal:
  * Enable both side-by-side
  * Show only the Gift Registry
  * Show only the Wishes Wall
  * Hide both completely (the section collapses neatly without leaving empty space)

### 6. Live Theme & Typography Customizer
* **6 Pre-Built Aesthetics**:
  1. *Bespoke Rose Gold* (Warm, romantic blush and metallic rose)
  2. *Royal Emerald & Gold* (Luxurious deep forest green and gold)
  3. *Classic Pure Ivory* (Timeless monochrome minimalism)
  4. *Midnight Sapphire* (Moody celestial navy and champagne)
  5. *Terracotta Sunset* (Warm bohemian earth tones)
  6. *Burgundy Velvet* (Deep wine red and warm gold)
* **Custom Colors**: Customize Background, Card Background, Primary Accent, Borders, and Text colors.
* **Google Font Pairings**: Choose distinct heading and body fonts, with full support for Latin, Arabic, Urdu, and Devanagari scripts.

### 7. Falling Petals Visual Simulation
* **Interactive Physics**: Lightweight animated petals drifting across the screen.
* **Customizable Settings**:
  * Toggle petals on/off
  * Choose petal color palette (Rose, Jasmine white, Marigold golden yellow, Lavender)
  * Adjust petal count and falling speed

### 8. Real-Time Admin Dashboard
* **Headcount Metrics**: Total RSVPs, confirmed attendees, declined count, and dietary summary.
* **Live Activity Logs**: View guest visits, link opens, and submitted RSVPs in real time.
* **Export to CSV**: Download guest lists for caterers, venue managers, and seating planners.
* **One-Click Link Copy & QR Code**: Copy shareable URLs or present a printable QR code for physical stationery cards.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` to configure optional server parameters:

```bash
cp .env.example .env
```

### 🎯 Changing the Port in One Place
To change the application port (e.g., from `3000` to `8080`), simply edit **`PORT`** in your `.env` file:
```env
PORT=8080
```
That's it! The system automatically handles the rest:
- **Node Server (`server.ts`)**: Automatically reads `PORT` from `.env` or `--port`.
- **Docker Compose (`docker-compose.yml`)**: Dynamically binds `${PORT}:${PORT}` and forwards environment variables without editing the compose file.
- **Docker Healthcheck**: Dynamically tests `http://localhost:${PORT}/health`.
- **Dockerfile**: Supports `ARG PORT=...` and dynamic `EXPOSE ${PORT}`.

| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `3000` | Port where the web server listens (single place configuration). |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`). |
| `DATABASE_PATH` | `./data/wedding_portal.sqlite` | SQLite database file location. |
| `APP_URL` | `http://localhost:3000` | Base URL used when generating shareable invitation links. |

---

## 📁 Project Structure

```text
├── data/                       # Persistent SQLite database storage
│   └── wedding_portal.sqlite   # Embedded SQLite file with WAL mode
├── server/                     # Backend Express server & database logic
│   ├── db.ts                   # SQLite schema, queries, and seed data
│   └── sse.ts                  # Server-Sent Events real-time synchronizer
├── src/                        # Frontend React + TypeScript application
│   ├── components/
│   │   ├── admin/              # Host Dashboard, Event Scheduler, Theme Studio
│   │   ├── guest/              # Guest Invitation, RSVP Modal, Audio, Registry
│   │   └── common/             # QR Code Modal, Petals Canvas, Navigation
│   ├── data/                   # Default wedding data and preset themes
│   ├── services/               # Client-side API client and storage services
│   ├── types/                  # TypeScript interfaces and type definitions
│   ├── App.tsx                 # Main application router and state holder
│   └── main.tsx                # React entry point
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Container orchestration with volume persistence
├── package.json                # Project scripts and dependencies
├── server.ts                   # Main server entry point (Vite dev + Express API)
└── vite.config.ts              # Vite bundler configuration
```

---

## 🔌 Backend API Endpoints

The built-in REST API provides endpoints for external integrations and frontend sync:

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Server status and database health check |
| `GET` | `/api/project` | Fetch current wedding project details and theme |
| `PUT` | `/api/project` | Update project settings, couple story, or active theme |
| `GET` | `/api/rsvps` | Retrieve all guest RSVPs |
| `POST` | `/api/rsvps` | Submit a new guest RSVP response |
| `GET` | `/api/stream` | Server-Sent Events stream for real-time live updates |
| `GET` | `/api/export/csv` | Download complete RSVP list as a CSV file |

---

## 🛡️ License & Credits

Built with ❤️ using **React**, **TypeScript**, **Tailwind CSS**, **Vite**, and **Express with SQLite**.

Feel free to customize, adapt, and use this template for your own wedding celebrations!
