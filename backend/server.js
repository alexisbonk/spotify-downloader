const express = require('express');
const cors = require('cors');
const querystring = require('querystring');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:4000/callback';

const queueFile = path.join(__dirname, 'queue.json');
let downloadQueue = [];
if (fs.existsSync(queueFile)) {
  try {
    downloadQueue = JSON.parse(fs.readFileSync(queueFile));
    logToFile(`[QUEUE] 📋 Queue loaded → ${downloadQueue.length} items from disk`, 'magenta');
  } catch (e) {
    logToFile('[QUEUE] 🛑 Failed to parse queue file', 'red');
    downloadQueue = [];
  }
}

const settingsFile = path.join(__dirname, 'settings.json');
let settings = {
  downloadPath: '/Volumes/Main volume/MUSIC 🎵/Test'
};
if (fs.existsSync(settingsFile)) {
  try {
    const fileContent = JSON.parse(fs.readFileSync(settingsFile));
    settings = { ...settings, ...fileContent };
    logToFile(`[SETTINGS] ⚙️  Settings loaded → Download path: ${settings.downloadPath}`, 'gray');
  } catch (e) {
    logToFile('[SETTINGS] 🛑 Failed to parse settings file', 'red');
  }
}

const saveQueue = () => {
  fs.writeFileSync(queueFile, JSON.stringify(downloadQueue, null, 2));
};

const saveSettings = () => {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
};

function logToFile(message, color) {
  const logFile = path.join(__dirname, 'server.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  if (color && chalk[color]) {
    console.log(chalk[color](message));
  } else if (color && color === 'blueBright') {
    console.log(chalk.blueBright(message));
  } else {
    console.log(message);
  }
}

function sanitizeFilename(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '-');
}

app.get('/auth', (req, res) => {
  logToFile('[AUTH] 🔐 Auth request received → Redirecting to Spotify login', 'cyan');
  const scope = 'user-read-private user-read-email';
  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI
  });
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const payload = querystring.stringify({
    code: code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  });

  const headers = {
    headers: {
      Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  try {
    const response = await axios.post(tokenUrl, payload, headers);
    const accessToken = response.data.access_token;
    logToFile('[CALLBACK] 🔐 Callback received → Access token acquired', 'cyan');
    res.redirect(`http://localhost:3000?access_token=${accessToken}`);
  } catch (error) {
    logToFile('[CALLBACK] 🛑 Error retrieving access token', 'red');
    res.status(400).send('Error retrieving access token');
  }
});

app.post('/settings', (req, res) => {
  const { downloadPath } = req.body;
  if (downloadPath) {
    settings.downloadPath = downloadPath;
    saveSettings();
    logToFile(`[SETTINGS] ⚙️  Settings updated → Download path set to: ${downloadPath}`, 'gray');
    res.status(200).send(settings);
  } else {
    res.status(400).send('Missing downloadPath');
  }
});

app.get('/settings', (req, res) => {
  res.status(200).send(settings);
});

app.get('/search', async (req, res) => {
  const { q, type, access_token } = req.query;
  if (!q || !type || !access_token) {
    return res.status(400).send('Missing q, type, or access_token');
  }
  logToFile(`[SEARCH] 🔎 Recherche ${type} : ${q}`, 'cyan');
  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { q, type, limit: 10 }
    });
    switch (type) {
      case 'track':
        res.status(200).json(response.data.tracks.items);
        break;
      case 'album':
        res.status(200).json(response.data.albums.items);
        break;
      case 'playlist':
        res.status(200).json(response.data.playlists.items);
        break;
      case 'artist':
        res.status(200).json(response.data.artists.items);
        break;
      case 'user':
        try {
          const playlistsResp = await axios.get(`https://api.spotify.com/v1/users/${q}/playlists`, {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          res.status(200).json(playlistsResp.data.items);
        } catch (e) {
          res.status(200).json([]);
        }
        break;
      default:
        res.status(200).json([]);
    }
  } catch (err) {
    logToFile(`[SEARCH] 🛑 Failed to search ${type}`, 'red');
    res.status(500).send('Failed to search');
  }
});

app.get('/artist-albums/:artistId', async (req, res) => {
  const { artistId } = req.params;
  const { access_token } = req.query;
  if (!artistId || !access_token) {
    return res.status(400).send('Missing artistId or access_token');
  }
  logToFile(`[ARTIST-ALBUMS] 🎤 Albums for artist: ${artistId}`, 'cyan');
  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    res.status(200).json(response.data.items);
  } catch (err) {
    logToFile('[ARTIST-ALBUMS] 🛑 Failed to fetch albums', 'red');
    res.status(500).send('Failed to fetch artist albums');
  }
});

app.get('/user-playlists/:userId', async (req, res) => {
  const { userId } = req.params;
  const { access_token } = req.query;
  logToFile(`[USER-PLAYLISTS] 👥 Fetching playlists for user: ${userId}`, 'cyan');
  if (!userId || !access_token) {
    return res.status(400).send('Missing userId or access_token');
  }
  try {
    const response = await axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    res.status(200).json(response.data.items);
  } catch (err) {
    res.status(500).send('Failed to fetch user playlists');
  }
});

app.post('/download', async (req, res) => {
  const { url, type, name } = req.body;
  const downloadPath = settings.downloadPath;
  if (!url || !downloadPath) {
    return res.status(400).send('Missing required fields: url or downloadPath');
  }

  const existingDownload = downloadQueue.find(item => item.url === url && item.status === 'started');
  if (existingDownload) {
    return res.status(400).send('Item is already being downloaded');
  }

  const id = new Date().getTime();
  let outputPath = downloadPath;
  const safeName = sanitizeFilename(name || 'unknown');

  if (type === 'playlist') {
    outputPath = path.join(outputPath, 'Playlists', safeName, '{title}');
  } else if (type === 'album') {
    outputPath = path.join(outputPath, 'Albums', '{artists}', safeName, '{title}');
  } else if (type === 'track') {
    outputPath = path.join(outputPath, 'Tracks', '{title}');
  } else {
    return res.status(400).send('Invalid download type');
  }

  const queueItem = { id, url, name, type, outputPath, progress: 0, status: 'started', totalTracks: 0, downloadedTracks: 0 };
  downloadQueue.push(queueItem);
  saveQueue();

  logToFile(`[DOWNLOAD:${id}] 🚀 Download started for: ${safeName}`);

  const process = spawn('spotdl', [url, '--output', `${outputPath}`]);
  queueItem.process = process;

  process.stdout.on('data', (data) => {
    const line = data.toString().trim().replace(/\n$/, '');

    if (line.toLowerCase().includes('found') && line.match(/Found (\d+) songs/i)) {
      const match = line.match(/Found (\d+) songs/i);
      if (match) {
        queueItem.totalTracks = parseInt(match[1]);
        updateProgress(queueItem);
      }
    }

    if (line.toLowerCase().includes('downloaded')) {
      queueItem.downloadedTracks++;
      updateProgress(queueItem);
    } else if (line.toLowerCase().includes('skipping') && line.toLowerCase().includes('duplicate')) {
      queueItem.downloadedTracks++;
      updateProgress(queueItem);
    }

    if (line.toLowerCase().includes('warning')) {
      logToFile(`[DOWNLOAD:${id}] ⚠️  WARNING → ${line}`);
    } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
      logToFile(`[DOWNLOAD:${id}] 🛑 ERROR → ${line}`);
    } else {
      logToFile(`[DOWNLOAD:${id}] ℹ️  INFO → ${line}`);
    }
  });

  process.stderr.on('data', (data) => {
    const line = data.toString().trim().replace(/\n$/, '');
    if (line.toLowerCase().includes('warning')) {
      logToFile(`[DOWNLOAD:${id}] ⚠️  WARNING → ${line}`);
    } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
      logToFile(`[DOWNLOAD:${id}] 🛑 ERROR → ${line}`);
    } else {
      logToFile(`[DOWNLOAD:${id}] ℹ️  INFO → ${line}`);
    }
  });

  process.on('close', (code) => {
    queueItem.status = code === 0 ? 'completed' : 'failed';
    queueItem.progress = code === 0 ? 100 : queueItem.progress;
    delete queueItem.process;
    saveQueue();
    const statusColor = code === 0 ? chalk.green : chalk.red;
    logToFile(`[DOWNLOAD:${id}] 📦 Download ${code === 0 ? 'completed' : 'failed'} for: ${safeName}`);
  });

  res.status(200).send({ message: 'Download started', queue: downloadQueue });
});

function updateProgress(queueItem) {
  if (queueItem.totalTracks > 0) {
    queueItem.progress = Math.min(100, Math.round((queueItem.downloadedTracks / queueItem.totalTracks) * 100));
  } else {
    queueItem.progress = 0;
  }
  saveQueue();
  logToFile(`[DOWNLOAD:${queueItem.id}] ℹ️  INFO →  Progress: ${queueItem.progress}% (${queueItem.downloadedTracks}/${queueItem.totalTracks})`);
}

app.post('/cancel-download', (req, res) => {
  const { id } = req.body;
  const queueItem = downloadQueue.find(item => item.id === id);

  if (!queueItem) {
    return res.status(404).send('Download not found');
  }

  if (queueItem.process && typeof queueItem.process.kill === 'function') {
    queueItem.process.kill();
    queueItem.status = 'canceled';
    queueItem.progress = 0;
    delete queueItem.process;
    saveQueue();
    logToFile(`[CANCEL:${id}] 🛑 Download canceled: ${queueItem.name}`);
    res.status(200).send({ message: 'Download canceled', queue: downloadQueue });
  } else {
    res.status(400).send('Process not running or already completed');
  }
});

app.post('/reset-queue', (req, res) => {
  downloadQueue = [];
  saveQueue();
  logToFile('[QUEUE] 🧹 Download queue reset');
  res.status(200).send({ message: 'Queue reset', queue: downloadQueue });
});

app.get('/queue', (req, res) => {
  logToFile(`[QUEUE] 📋 Queue requested → ${downloadQueue.length} items`);
  res.status(200).send(downloadQueue);
});

app.listen(4000, () => {
  logToFile('[SERVER] 🎧 Server started on port 4000');
});
