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

- Node.js (v14 or higher) **OR** Docker/Docker Compose
- A Spotify developer application (Client ID/Secret)

---

## 🐳 Docker Installation (Recommended)

The easiest way to run Spotify Downloader is with Docker. No need to install Node.js, spotDL, or other dependencies!

### 1. Clone the repository
```bash
$ git clone https://github.com/yourname/spotify-downloader.git
$ cd spotify-downloader
```

### 2. Configure Environment Variables

Create a `.env` file at the project root with your Spotify credentials:
```bash
cp .env.example .env
```

Edit the `.env` file with your Spotify Developer credentials:
```dotenv
SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

Optional variables:
```dotenv
PLEX_TOKEN=your_plex_token
PLEX_SERVER_ID=your_plex_server_id
```

### 3. Start with Docker Compose

**For production:**
```bash
$ docker-compose up -d
```

**For development (with hot reload):**
```bash
$ docker-compose -f docker-compose.dev.yml up -d
```

Access the app at: http://localhost:3535

### 4. Fichiers Téléchargés

Les fichiers sont enregistrés directement dans le volume monté depuis votre système hôte. Vous pouvez y accéder directement à l'emplacement configuré dans votre fichier `.env` (par défaut : `/Volumes/Main volume/MUSIC`).

Pour modifier l'emplacement de téléchargement, mettez à jour la variable `DOWNLOAD_PATH` dans votre fichier `.env`.

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start production container |
| `docker-compose down` | Stop and remove container |
| `docker-compose logs -f` | View logs |
| `docker-compose exec spotify-downloader sh` | Access container shell |
| `docker-compose pull` | Pull latest image |
| `docker-compose build --no-cache` | Rebuild from scratch |

---

## 💻 Manual Installation

If you prefer to install without Docker:

### 1. Clone & install
```bash
$ git clone https://github.com/yourname/spotify-downloader.git
$ cd spotify-downloader
$ npm run install-all
```

### 2. Install spotDL and yt-dlp
```bash
$ pip install spotdl==4.4.3 yt-dlp
```

### 3. Configure Spotify App & Environment Variables

#### Spotify Developer Application Setup
1. Créez une application sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Dans les paramètres de l'application, ajoutez le redirect URI suivant :
   ```
   http://127.0.0.1:4420/callback
   ```

#### Environment Variables
Create a `.env` at project root with **only** these required variables:
```dotenv
SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

Variables optionnelles :
```dotenv
DOWNLOAD_PATH=/Volumes/Main\ volume/MUSIC
PORT=8585
```

#### Frontend port configuration

To change the port used by the React frontend (default is 3535), create a `.env` file at the root of the project and add:

```
PORT=3535
```

This will start the React frontend on port 3535.

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
Navigate to `http://localhost:3535` (or your configured port) and authenticate with Spotify.

### 4. Production build
```bash
$ npm run build
```

## ⚙️ Available NPM scripts
| Command | Description |
|---------|-------------|
| `npm run install-all` | Install dependencies for both frontend and backend |
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev-simple` | Start frontend and backend concurrently |
| `npm run dev-frontend` | Start React frontend only |
| `npm run dev-backend` | Start Express server only |
| `npm run server` | Start Express server |
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