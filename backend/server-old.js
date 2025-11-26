const express = require('express');
const cors = require('cors');
const querystring = require('querystring');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logToFile = require('./logToFile');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

const queueFile = path.join(__dirname, 'queue.json');
let downloadQueue = [];
if (fs.existsSync(queueFile)) {
  try {
    downloadQueue = JSON.parse(fs.readFileSync(queueFile));
    logToFile(`[QUEUE] 📋 Queue loaded → ${downloadQueue.length} items from disk`, 'magenta');
    let normalized = 0;
    for (const item of downloadQueue) {
      if (item.status === 'started' && !item.process) {
        item.status = 'queued';
        item.progress = 0;
        normalized++;
      }
    }
    if (normalized > 0) {
      logToFile(`[QUEUE] ♻️  Normalized ${normalized} stale started items to queued`, 'magenta');
      fs.writeFileSync(queueFile, JSON.stringify(downloadQueue, null, 2));
    }
  } catch (e) {
    logToFile('[QUEUE] 🛑 Failed to parse queue file', 'red');
    downloadQueue = [];
  }
}

const MAX_CONCURRENT_DOWNLOADS = 3;

function getRunningCount() {
  return downloadQueue.filter((item) => item.status === 'started' && item.process).length;
}

function processQueue() {
  while (getRunningCount() < MAX_CONCURRENT_DOWNLOADS) {
    const next = downloadQueue.find((item) => item.status === 'queued');
    if (!next) break;
    startQueueItem(next);
  }
}

const settingsFile = path.join(__dirname, 'settings.json');
let settings = {
  downloadPath: '',
  autoRefreshQueue: false,
  plexUrl: '',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
  spotifyRedirectUri: 'http://127.0.0.1:4420/callback',
  plexToken: process.env.REACT_APP_PLEX_TOKEN || process.env.PLEX_TOKEN || '',
  plexServerId: process.env.PLEX_SERVER_ID || ''
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

function sanitizeFilename(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, '-');
}

app.get('/auth', (req, res) => {
  logToFile('[AUTH] 🔐 Auth request received → Redirecting to Spotify login', 'cyan');
  const scope = 'user-read-private user-read-email';
  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: settings.spotifyClientId,
    scope: scope,
    redirect_uri: settings.spotifyRedirectUri
  });
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const payload = querystring.stringify({
    code: code,
    redirect_uri: settings.spotifyRedirectUri,
    grant_type: 'authorization_code'
  });

  const headers = {
    headers: {
      Authorization: 'Basic ' + Buffer.from(settings.spotifyClientId + ':' + settings.spotifyClientSecret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  try {
    const response = await axios.post(tokenUrl, payload, headers);
    const accessToken = response.data.access_token;
    logToFile('[CALLBACK] 🔐 Callback received → Access token acquired', 'cyan');
    res.redirect(`http://localhost:3420?access_token=${accessToken}`);
  } catch (error) {
    logToFile('[CALLBACK] 🛑 Error retrieving access token', 'red');
    res.status(400).send('Error retrieving access token');
  }
});

app.get('/album-tracks/:albumId', async (req, res) => {
  const { albumId } = req.params;
  const { access_token } = req.query;
  if (!albumId || !access_token) {
    return res.status(400).send('Missing albumId or access_token');
  }
  logToFile(`[ALBUM-TRACKS] 🎧 Tracks for album: ${albumId}`, 'cyan');
  try {
    let allTracks = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit, offset }
      });
      allTracks = allTracks.concat(response.data.items || []);
      hasMore = !!response.data.next;
      offset += limit;
    }

    res.status(200).json(allTracks);
  } catch (err) {
    logToFile(`[ALBUM-TRACKS] 🛑 Failed to fetch tracks for album: ${albumId}`, 'red');
    res.status(500).send('Failed to fetch album tracks');
  }
});

app.post('/settings', async (req, res) => {
  const { 
    downloadPath, 
    autoRefreshQueue, 
    plexUrl, 
    spotifyClientId, 
    spotifyClientSecret, 
    spotifyRedirectUri, 
    plexToken, 
    plexServerId 
  } = req.body;
  
  let changed = false;
  let errors = [];

  const validateSpotifyCredentials = async () => {
    if (spotifyClientId === undefined && spotifyClientSecret === undefined) return;
    
    const clientId = spotifyClientId ?? settings.spotifyClientId;
    const clientSecret = spotifyClientSecret ?? settings.spotifyClientSecret;
    
    if (!clientId || !clientSecret) return;
    
    try {
      const testAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const testResponse = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials', 
        {
          headers: {
            'Authorization': `Basic ${testAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (!testResponse.data.access_token) {
        errors.push('Spotify Client ID ou Client Secret invalide');
      }
    } catch (error) {
      errors.push('Spotify Client ID ou Client Secret invalide');
      logToFile(`[SETTINGS] 🛑 Invalid Spotify credentials: ${error.message}`, 'red');
    }
  };

  const validatePlexToken = async () => {
    if (plexToken === undefined || !plexToken || !plexUrl) return;
    
    try {
      const testPlexUrl = plexUrl || settings.plexUrl;
      const response = await axios.get(`${testPlexUrl}/identity`, {
        headers: { 'X-Plex-Token': plexToken },
        timeout: 5000
      });
      
      if (!response.data) {
        errors.push('Token Plex invalide ou serveur inaccessible');
      }
    } catch (error) {
      errors.push('Token Plex invalide ou serveur inaccessible');
      logToFile(`[SETTINGS] 🛑 Invalid Plex token: ${error.message}`, 'red');
    }
  };

  await validateSpotifyCredentials();
  await validatePlexToken();

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  const updateSettings = [
    { 
      condition: downloadPath !== undefined, 
      action: () => {
        settings.downloadPath = downloadPath;
        logToFile(`[SETTINGS] ⚙️  Settings updated → Download path set to: ${downloadPath}`, 'gray');
      }
    },
    { 
      condition: autoRefreshQueue !== undefined, 
      action: () => {
        settings.autoRefreshQueue = !!autoRefreshQueue;
        logToFile(`[SETTINGS] ⚙️  Settings updated → autoRefreshQueue set to: ${autoRefreshQueue}`, 'gray');
      }
    },
    { 
      condition: plexUrl !== undefined, 
      action: () => {
        settings.plexUrl = plexUrl;
        logToFile(`[SETTINGS] ⚙️  Settings updated → plexUrl set to: ${plexUrl}`, 'gray');
      }
    },
    { 
      condition: spotifyClientId !== undefined, 
      action: () => {
        settings.spotifyClientId = spotifyClientId;
        logToFile(`[SETTINGS] ⚙️  Settings updated → Spotify Client ID set`, 'gray');
      }
    },
    { 
      condition: spotifyClientSecret !== undefined, 
      action: () => {
        settings.spotifyClientSecret = spotifyClientSecret;
        logToFile(`[SETTINGS] ⚙️  Settings updated → Spotify Client Secret set`, 'gray');
      }
    },
    { 
      condition: spotifyRedirectUri !== undefined, 
      action: () => {
        settings.spotifyRedirectUri = spotifyRedirectUri;
        logToFile(`[SETTINGS] ⚙️  Settings updated → Spotify Redirect URI set to: ${spotifyRedirectUri}`, 'gray');
      }
    },
    { 
      condition: plexToken !== undefined, 
      action: () => {
        settings.plexToken = plexToken;
        logToFile(`[SETTINGS] ⚙️  Settings updated → Plex Token set`, 'gray');
      }
    },
    { 
      condition: plexServerId !== undefined, 
      action: () => {
        settings.plexServerId = plexServerId;
        logToFile(`[SETTINGS] ⚙️  Settings updated → Plex Server ID set to: ${plexServerId}`, 'gray');
      }
    }
  ];

  updateSettings.forEach(({ condition, action }) => {
    if (condition) {
      action();
      changed = true;
    }
  });

  if (changed) {
    saveSettings();
    res.status(200).send(settings);
  } else {
    res.status(400).send('Missing settings fields');
  }
});

app.get('/settings', (req, res) => {
  res.status(200).send(settings);
});

app.post('/validate-path', async (req, res) => {
  const testPath = (req.body && (req.body.path || req.body.downloadPath)) || '';
  if (!testPath || typeof testPath !== 'string') {
    logToFile('[VALIDATE-PATH] 🛑 No path provided', 'red');
    return res.status(400).json({ valid: false, message: 'No path provided' });
  }

  logToFile(`[VALIDATE-PATH] 🔍 Validate request for: ${testPath}`, 'cyan');

  if (/^([a-z]+):\/\//i.test(testPath)) {
    logToFile(`[VALIDATE-PATH] 🛑 Unsupported scheme for: ${testPath}`, 'red');
    return res.status(400).json({ valid: false, message: 'Unsupported path scheme for validation on server' });
  }

  try {
    const stat = fs.existsSync(testPath) ? fs.statSync(testPath) : null;
    if (!stat || !stat.isDirectory()) {
      logToFile(`[VALIDATE-PATH] 🛑 Not a directory or missing: ${testPath}`, 'red');
      return res.status(400).json({ valid: false, message: 'Path does not exist or is not a directory' });
    }

    const tmpFile = path.join(testPath, `.spotify_downloader_check_${Date.now()}`);
    try {
      fs.writeFileSync(tmpFile, 'ok');
      fs.unlinkSync(tmpFile);
    } catch (e) {
      logToFile(`[VALIDATE-PATH] 🛑 No write permission in: ${testPath}`, 'red');
      return res.status(400).json({ valid: false, message: 'No write permission in this directory' });
    }

    logToFile(`[VALIDATE-PATH] ✅ Path is accessible and writable: ${testPath}`, 'green');
    return res.status(200).json({ valid: true, message: 'Path is accessible and writable' });
  } catch (e) {
    logToFile(`[VALIDATE-PATH] 🛑 Unexpected error while validating: ${testPath}`, 'red');
    return res.status(500).json({ valid: false, message: 'Unexpected error while validating path' });
  }
});

app.post('/validate-plex-url', async (req, res) => {
  const testUrl = (req.body && req.body.url) || '';
  if (!testUrl || typeof testUrl !== 'string') {
    logToFile('[VALIDATE-PLEX] 🛑 No URL provided', 'red');
    return res.status(400).json({ valid: false, message: 'No URL provided' });
  }
  logToFile(`[VALIDATE-PLEX] 🔍 Validate request for: ${testUrl}`, 'cyan');

  try {
    const url = new URL(testUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      logToFile(`[VALIDATE-PLEX] 🛑 Invalid protocol for: ${testUrl}`, 'red');
      return res.status(400).json({ valid: false, message: 'URL must use HTTP or HTTPS protocol' });
    }
  } catch (e) {
    logToFile(`[VALIDATE-PLEX] 🛑 Invalid URL format: ${testUrl}`, 'red');
    return res.status(400).json({ valid: false, message: 'Invalid URL format' });
  }
  try {
    const response = await axios.get(testUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    const isPlexServer = response.headers['x-plex-protocol'] || 
                        (response.data && response.data.includes('plex')) ||
                        response.headers.server?.toLowerCase().includes('plex');
    if (response.status === 200 || response.status === 401) {
      logToFile(`[VALIDATE-PLEX] ✅ Plex server accessible: ${testUrl}`, 'green');
      return res.status(200).json({ 
        valid: true, 
        message: isPlexServer ? 'Plex server is accessible' : 'Server is accessible (may not be Plex)'
      });
    } else {
      logToFile(`[VALIDATE-PLEX] ⚠️  Server responded with status ${response.status}: ${testUrl}`, 'yellow');
      return res.status(200).json({ 
        valid: true, 
        message: `Server accessible but returned status ${response.status}`
      });
    }
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      logToFile(`[VALIDATE-PLEX] 🛑 Connection refused: ${testUrl}`, 'red');
      return res.status(400).json({ valid: false, message: 'Connection refused - server may be offline' });
    } else if (e.code === 'ENOTFOUND') {
      logToFile(`[VALIDATE-PLEX] 🛑 Host not found: ${testUrl}`, 'red');
      return res.status(400).json({ valid: false, message: 'Host not found - check the URL' });
    } else if (e.code === 'ETIMEDOUT') {
      logToFile(`[VALIDATE-PLEX] 🛑 Connection timeout: ${testUrl}`, 'red');
      return res.status(400).json({ valid: false, message: 'Connection timeout - server may be slow or unreachable' });
    } else {
      logToFile(`[VALIDATE-PLEX] 🛑 Unexpected error while validating: ${testUrl} - ${e.message}`, 'red');
      return res.status(500).json({ valid: false, message: 'Unexpected error while validating URL' });
    }
  }
});

app.get('/playlist-tracks/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const { access_token } = req.query;
  if (!playlistId || !access_token) {
    return res.status(400).send('Missing playlistId or access_token');
  }
  try {
    let allItems = [];
    let offset = 0;
    let total = null;
    const limit = 100;
    do {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${access_token}` },
        params: { limit, offset }
      });
      if (total === null) total = response.data.total;
      allItems = allItems.concat(response.data.items);
      offset += limit;
    } while (allItems.length < total);
    const logToFile = require('./logToFile');
    logToFile(`[SPOTIFY] Playlist ${playlistId} → ${allItems.length} tracks récupérés`);
    res.status(200).json(allItems);
  } catch (err) {
    res.status(500).send('Failed to fetch playlist tracks');
  }
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
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit: 50 }
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

app.post('/validate-plex-url', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ valid: false, message: 'URL manquante' });
  }
  try {
    const response = await axios.get(`${url}/identity`, { timeout: 5000 });
    if (response.status === 200) {
      res.status(200).json({ valid: true, message: 'URL Plex valide' });
    } else {
      res.status(200).json({ valid: false, message: 'Serveur Plex inaccessible' });
    }
  } catch (error) {
    res.status(200).json({ valid: false, message: 'Impossible de se connecter au serveur Plex' });
  }
});

app.post('/validate-spotify-credentials', async (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ valid: false, message: 'Client ID et Client Secret requis' });
  }
  try {
    const testAuth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials', 
      {
        headers: {
          'Authorization': 'Basic ' + testAuth,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    if (response.data.access_token) {
      res.status(200).json({ valid: true, message: 'Credentials Spotify valides' });
    } else {
      res.status(200).json({ valid: false, message: 'Credentials Spotify invalides' });
    }
  } catch (error) {
    res.status(200).json({ valid: false, message: 'Credentials Spotify invalides' });
  }
});

app.post('/validate-plex-token', async (req, res) => {
  const { token, plexUrl } = req.body;
  if (!token || !plexUrl) {
    return res.status(400).json({ valid: false, message: 'Token et URL Plex requis' });
  }
  try {
    const response = await axios.get(`${plexUrl}/identity`, {
      headers: { 'X-Plex-Token': token },
      timeout: 5000
    });
    if (response.data) {
      res.status(200).json({ valid: true, message: 'Token Plex valide' });
    } else {
      res.status(200).json({ valid: false, message: 'Token Plex invalide' });
    }
  } catch (error) {
    res.status(200).json({ valid: false, message: 'Token Plex invalide ou serveur inaccessible' });
  }
});

app.post('/download', async (req, res) => {
  const { url, type, name } = req.body;
  const downloadPath = settings.downloadPath;
  if (!url || !downloadPath) {
    return res.status(400).send('Missing required fields: url or downloadPath');
  }

  const existingDownload = downloadQueue.find(item => item.url === url && (item.status === 'started' || item.status === 'queued'));
  if (existingDownload) {
    return res.status(400).send('Item is already being downloaded');
  }

  const id = new Date().getTime();
  let outputPath = path.join(downloadPath, '{artist}', '{album}', '{title}');
  const queueItem = { 
    id, 
    url, 
    name, 
    type, 
    outputPath, 
    progress: 0, 
    status: 'queued', 
    totalTracks: 0, 
    downloadedTracks: 0,
    failedTracks: [],
    logs: [],
    startTime: null,
    endTime: null,
    failureReason: null
  };
  downloadQueue.push(queueItem);
  saveQueue();
  processQueue();

  const message = getRunningCount() <= MAX_CONCURRENT_DOWNLOADS && queueItem.status === 'started'
    ? 'Download started'
    : 'Download queued';
  res.status(200).send({ message, queue: downloadQueue });
});

function addLogToQueue(queueItem, message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  queueItem.logs.push({ timestamp, message, type });
  if (queueItem.logs.length > 50) {
    queueItem.logs = queueItem.logs.slice(-50);
  }
}

function updateProgress(queueItem) {
  if (queueItem.totalTracks > 0) {
    queueItem.progress = Math.min(100, Math.round((queueItem.downloadedTracks / queueItem.totalTracks) * 100));
  } else {
    queueItem.progress = 0;
  }
  saveQueue();
  logToFile(`[DOWNLOAD:${queueItem.id}] ℹ️  INFO →  Progress: ${queueItem.progress}% (${queueItem.downloadedTracks}/${queueItem.totalTracks})`);
  addLogToQueue(queueItem, `Progress: ${queueItem.progress}% (${queueItem.downloadedTracks}/${queueItem.totalTracks})`, 'info');
}

function startQueueItem(queueItem) {
  if (queueItem.status !== 'queued') return;

  const { id, url, type, outputPath, name } = queueItem;
  const safeName = sanitizeFilename(name || 'unknown');
  queueItem.status = 'started';
  queueItem.progress = 0;
  queueItem.totalTracks = 0;
  queueItem.downloadedTracks = 0;
  queueItem.startTime = new Date().toISOString();
  queueItem.failedTracks = [];
  saveQueue();

  logToFile(`[DOWNLOAD:${id}] 🚀 Download started for ${type}: ${safeName}`);
  addLogToQueue(queueItem, `Download started for ${type}: ${safeName}`, 'info');
  const args = [url, '--output', `${outputPath}`, '--audio', 'youtube', '--dont-filter-results'];
  const child = spawn('spotdl', args);
  queueItem.process = child;

  child.stdout.on('data', (data) => {
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

    if (line.toLowerCase().includes('failed') || line.toLowerCase().includes('error downloading')) {
      const trackMatch = line.match(/(?:Failed|Error downloading).*?["']([^"']+)["']/i);
      if (trackMatch) {
        queueItem.failedTracks.push({
          name: trackMatch[1],
          reason: line.includes('youtube') ? 'Titre non trouvé sur YouTube' : 'Erreur de téléchargement',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (line.toLowerCase().includes('warning')) {
      logToFile(`[DOWNLOAD:${id}] ⚠️  WARNING → ${line}`);
      addLogToQueue(queueItem, line, 'warning');
    } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
      logToFile(`[DOWNLOAD:${id}] 🛑 ERROR → ${line}`);
      addLogToQueue(queueItem, line, 'error');
    } else {
      //logToFile(`[DOWNLOAD:${id}] ℹ️  INFO → ${line}`);
    }
  });

  child.stderr.on('data', (data) => {
    const line = data.toString().trim().replace(/\n$/, '');
    if (line.toLowerCase().includes('warning')) {
      logToFile(`[DOWNLOAD:${id}] ⚠️  WARNING → ${line}`);
    } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
      logToFile(`[DOWNLOAD:${id}] 🛑 ERROR → ${line}`);
    } else {
      //logToFile(`[DOWNLOAD:${id}] ℹ️  INFO → ${line}`);
    }
  });

  child.on('close', (code) => {
    queueItem.endTime = new Date().toISOString();
    
    if (queueItem.status === 'canceled') {
      queueItem.progress = 0;
      delete queueItem.process;
      addLogToQueue(queueItem, `Download canceled for: ${safeName}`, 'warning');
      saveQueue();
      logToFile(`[DOWNLOAD:${id}] 📦 Download canceled for: ${safeName}`, 'yellow');
      processQueue();
      return;
    }
    
    queueItem.status = code === 0 ? 'completed' : 'failed';
    
    if (code === 0) {
      if (queueItem.totalTracks > 0) {
        const ratio = queueItem.totalTracks === 0 ? 0 : (queueItem.downloadedTracks / queueItem.totalTracks);
        queueItem.progress = Math.min(100, Math.round(ratio * 100));
        
        if (queueItem.downloadedTracks < queueItem.totalTracks) {
          addLogToQueue(queueItem, `Download completed but incomplete: ${queueItem.downloadedTracks}/${queueItem.totalTracks} tracks downloaded`, 'warning');
        } else {
          addLogToQueue(queueItem, `Download completed successfully: ${queueItem.downloadedTracks}/${queueItem.totalTracks} tracks downloaded`, 'success');
        }
      } else {
        queueItem.progress = 100;
        addLogToQueue(queueItem, `Download completed successfully`, 'success');
      }
    } else {
      queueItem.failureReason = `Process exited with code ${code}`;
      addLogToQueue(queueItem, `Download failed with exit code ${code}`, 'error');
    }
    
    delete queueItem.process;
    saveQueue();
    const color = queueItem.status === 'completed' ? 'green' : 'red';
    logToFile(`[DOWNLOAD:${id}] 📦 Download ${queueItem.status} for: ${safeName}`, color);
    processQueue();
  });
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
    try { processQueue(); } catch (e) {}
    res.status(200).send({ message: 'Download canceled', queue: downloadQueue });
  } else if (queueItem.status === 'queued') {
    queueItem.status = 'canceled';
    queueItem.progress = 0;
    saveQueue();
    logToFile(`[CANCEL:${id}] 🛑 Queued download canceled: ${queueItem.name}`);
    try { processQueue(); } catch (e) {}
    res.status(200).send({ message: 'Queued download canceled', queue: downloadQueue });
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

const syncPlexPlaylist = require('./syncPlexPlaylist');

app.post('/sync-plex-playlist', async (req, res) => {
  logToFile(`[PLEX_SYNC] Appel /sync-plex-playlist`);
  const { spotifyTracks, playlistTitle } = req.body;
  const plexUrl = settings.plexUrl || process.env.REACT_APP_PLEX_URL || process.env.PLEX_URL;
  const plexToken = settings.plexToken || process.env.REACT_APP_PLEX_TOKEN || process.env.PLEX_TOKEN;
  const serverId = settings.plexServerId || process.env.PLEX_SERVER_ID;
  
  logToFile(`[PLEX_SYNC] Configuration: plexUrl=${!!plexUrl}, plexToken=${!!plexToken}, serverId=${!!serverId}`, 'gray');
  
  if (!spotifyTracks || !playlistTitle || !plexUrl || !plexToken) {
    logToFile(`[PLEX_SYNC] Champs manquants - spotifyTracks: ${!!spotifyTracks}, playlistTitle: ${!!playlistTitle}, plexUrl: ${!!plexUrl}, plexToken: ${!!plexToken}`, 'red');
    return res.status(400).send('Missing fields');
  }
  try {
    logToFile(`[PLEX_SYNC] Début synchronisation playlist: ${playlistTitle}`);
    const ratingKeys = await syncPlexPlaylist({ spotifyTracks, plexConfig: { baseUrl: plexUrl, token: plexToken, accessToken: plexToken, serverId }, playlistTitle });
    logToFile(`[PLEX_SYNC] Fin synchronisation playlist: ${playlistTitle} → ${ratingKeys.length} tracks trouvés`);
    res.status(200).json({ ratingKeys });
  } catch (e) {
    logToFile(`[PLEX_SYNC] Erreur sync: ${e && e.stack ? e.stack : e}`, 'red');
    res.status(500).send('Failed to sync playlist');
  }
});

app.listen(4420, () => {
  logToFile('[SERVER] 🎧 Server started on port 4420');
  setTimeout(() => {
    const queuedCount = downloadQueue.filter(item => item.status === 'queued').length;
    if (queuedCount > 0) {
      logToFile(`[SERVER] 🚀 Processing ${queuedCount} queued items from previous session`, 'cyan');
      try { processQueue(); } catch (e) {
        logToFile(`[SERVER] 🛑 Error processing queue on startup: ${e.message}`, 'red');
      }
    }
  }, 1000);
});
