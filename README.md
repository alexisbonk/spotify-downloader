# 🎧 spotify-download

![MIT License](https://img.shields.io/badge/license-MIT-green)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Build](https://img.shields.io/github/actions/workflow/status/yourname/nastify/ci.yml?branch=main)

> Download Spotify tracks, albums, and playlists with a single click.  
> Explore public playlists, manage your download queue, and sync your music library – all in a modern, dark-mode interface.

<p align="center">
  <img src="docs/demo.gif" alt="spotify-download demo" width="720"/>
</p>

---

## ✨ Features

- 🔍 Search for tracks, albums, playlists, and artists
- ⬇️ One-click downloads to your chosen folder (NAS-friendly)
- 🧑‍🤝‍🧑 Explore any user’s public playlists
- 📋 Live queue with progress and controls
- ☁️ Uses the official Spotify API for search & metadata
- 🎧 Audio powered by [spotDL](https://github.com/spotDL/spotify-downloader)
- 🌗 Responsive dark UI (React, CSS Grid)

## 🖼️ Screenshots

| Search | Queue | Settings |
|--------|-------|----------|
| ![Search](docs/screen-search.png) | ![Queue](docs/screen-queue.png) | ![Settings](docs/screen-settings.png) |

## 🏗️ Architecture Overview

```
spotify-download/
 ├─ frontend/ (React)
 │   ├─ components/
 │   ├─ hooks/
 │   ├─ api/
 │   └─ styles/
 └─ backend/ (Node + Express)
     ├─ server.js
     └─ logger/
```

---

## ❤️ Special Thanks

This project relies on the amazing [spotDL](https://github.com/spotDL/spotify-downloader) for audio downloads.  
Check out their project and give them a star!


- A Spotify developer application (Client ID/Secret)
- **yt-dlp** installed on the server _(optional – can be bundled in Docker)_

### 1. Clone & install
```bash
$ git clone https://github.com/yourname/nastify.git
$ cd nastify
$ npm install
$ npm run setup-backend
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

### 3. Hack away in dev mode
```bash
$ npm run dev
```
Navigate to `http://localhost:3420` and authenticate with Spotify.

### 4. Production build (Docker example)
```bash
$ docker build -t nastify .
$ docker run -d -p 80:80 nastify
```

## ⚙️ Available NPM scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Front & back in watch mode |
| `npm run start:frontend` | React only |
| `npm run start:backend` | Express only |
| `npm run build` | Optimised React build |
| `npm test` | Vitest / Jest unit tests |

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