# 🎧 Spotify Downloader

![MIT License](https://img.shields.io/badge/license-MIT-green)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> Download Spotify tracks, albums, and playlists with a single click.  
> Explore public playlists, manage your download queue, and sync your music library – all in a modern, responsive interface with Material-UI components.

<p align="center">
  <img src="docs/demo.gif" alt="spotify-download demo" width="720"/>
</p>

---

## ✨ Features

- 🔍 Search for tracks, albums, playlists, and artists
- ⬇️ One-click downloads to your chosen folder (NAS-friendly)
- 🧑‍🤝‍🧑 Explore any user's public playlists
- 📋 Advanced queue management with visual progress indicators
- 🎯 Improved error handling with detailed French error messages
- 📊 Clean progress tracking without confusing percentage displays
- ☁️ Uses the official Spotify API for search & metadata
- 🎧 Audio powered by [spotDL](https://github.com/spotDL/spotify-downloader)
- 🎨 Modern UI with Material-UI, React Icons, and Tailwind CSS
- 🔔 Toast notifications for user feedback
- 📱 Fully responsive design

## 🖼️ Screenshots

| Search | Queue | Settings |
|--------|-------|----------|
| ![Search](docs/screen-search.png) | ![Queue](docs/screen-queue.png) | ![Settings](docs/screen-settings.png) |

## 🏗️ Architecture Overview

```
spotify-downloader/
 ├─ src/ (React Frontend)
 │   ├─ components/
 │   ├─ contexts/
 │   ├─ api/
 │   └─ styles/
 ├─ backend/ (Node.js + Express)
 │   ├─ routes/
 │   ├─ services/
 │   ├─ data/
 │   └─ server.js
 └─ public/
     └─ static assets
```

---

## ❤️ Special Thanks

This project relies on the amazing [spotDL](https://github.com/spotDL/spotify-downloader) for audio downloads.  
Check out their project and give them a star!

## 🚀 Prerequisites

- Node.js (v14 or higher)
- A Spotify developer application (Client ID/Secret)
- **spotDL** installed on the system
- **yt-dlp** (usually installed with spotDL)

### 1. Clone & install
```bash
$ git clone https://github.com/yourname/spotify-downloader.git
$ cd spotify-downloader
$ npm install
$ cd backend && npm install && cd ..
```

### 2. Configure env
Create a `.env` at project root:
```dotenv
SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
DOWNLOAD_PATH=/Volumes/Main\ volume/MUSIC
PORT=4420
```

#### Frontend port configuration

To change the port used by the React frontend (default is 3000), create a `.env` file at the root of the project and add:

```
PORT=3420
```

This will start the React frontend on port 3420 instead of 3000.

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Material-UI** - Component library
- **Tailwind CSS** - Utility-first CSS
- **React Icons** - Icon library
- **Axios** - HTTP client
- **React Toastify** - Notifications

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Axios** - HTTP client
- **CORS** - Cross-origin resource sharing
- **spotDL** - Audio download engine

### 3. Start development servers
```bash
$ npm run dev
```
This will start both frontend (React) and backend (Express) servers concurrently.
Navigate to `http://localhost:3000` (or your configured port) and authenticate with Spotify.

### 4. Production build
```bash
$ npm run build
```

## ⚙️ Available NPM scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm start` | Start React frontend only |
| `npm run build` | Create optimized React build |
| `npm test` | Run React tests |

### Backend scripts (run from backend/ directory)
| Command | Description |
|---------|-------------|
| `npm start` | Start Express server |

## 🧑‍💻 Contributing
1. Fork the repo & create your feature branch: `git checkout -b amazing-feature`
2. Commit your changes with Conventional Commits
3. Push and open a PR 🚀

All ideas & feedback are welcome!

## 📜 License

Distributed under the **MIT** License. See [`LICENSE`](LICENSE) for more information.

---

<p align="center">
Made with ♥︎ & Spotify API · 2025
</p>