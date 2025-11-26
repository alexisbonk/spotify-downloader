const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logToFile = require('../utils/logToFile');

router.get('/', (req, res) => {
  res.status(200).send(req.app.locals.settings);
});

router.post('/', async (req, res) => {
  const settings = req.app.locals.settings;
  const saveSettings = req.app.locals.saveSettings;
  
  const { 
    downloadPath, 
    autoRefreshQueue, 
    refreshInterval, 
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
    if ((spotifyClientId === undefined || spotifyClientId === '' || spotifyClientId === null) && 
        (spotifyClientSecret === undefined || spotifyClientSecret === '' || spotifyClientSecret === null)) return;
    
    const clientId = spotifyClientId ?? settings.spotifyClientId;
    const clientSecret = spotifyClientSecret ?? settings.spotifyClientSecret;
    
    if (!clientId || !clientSecret || clientId === '' || clientSecret === '') return;
    
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
    if (plexToken === undefined || plexToken === '' || plexToken === null) return;
    
    const testPlexUrl = plexUrl || settings.plexUrl;
    if (!testPlexUrl) return;
    
    try {
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
      success: false,
      message: errors.join('. '),
      errors: errors
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
      condition: refreshInterval !== undefined, 
      action: () => {
        settings.refreshInterval = parseInt(refreshInterval);
        logToFile(`[SETTINGS] ⚙️  Settings updated → refreshInterval set to: ${refreshInterval}ms`, 'gray');
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
    res.status(200).json({ success: true, message: 'Settings saved successfully', settings });
  } else {
    res.status(400).json({ success: false, message: 'No valid settings fields provided' });
  }
});

router.post('/validate-path', async (req, res) => {
  const testPath = (req.body && (req.body.path || req.body.downloadPath)) || '';
  if (!testPath || typeof testPath !== 'string') {
    logToFile('[VALIDATE-PATH] 🛑 No path provided', 'red');
    return res.status(400).json({ valid: false, message: 'No path provided' });
  }
  logToFile(`[VALIDATE-PATH] 📂 Validating path: ${testPath}`, 'cyan');
  try {
    const resolvedPath = path.resolve(testPath);
    if (!fs.existsSync(resolvedPath)) {
      logToFile('[VALIDATE-PATH] ⚠️  Path does not exist, attempting to create...', 'yellow');
      fs.mkdirSync(resolvedPath, { recursive: true });
      logToFile('[VALIDATE-PATH] ✅ Path created successfully', 'green');
    }
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      logToFile('[VALIDATE-PATH] 🛑 Path is not a directory', 'red');
      return res.status(400).json({ valid: false, message: 'Path is not a directory' });
    }
    fs.accessSync(resolvedPath, fs.constants.W_OK);
    logToFile('[VALIDATE-PATH] ✅ Path is valid and writable', 'green');
    res.status(200).json({ valid: true, resolvedPath });
  } catch (err) {
    logToFile(`[VALIDATE-PATH] 🛑 Path validation failed: ${err.message}`, 'red');
    if (err.code === 'EACCES') {
      res.status(400).json({ valid: false, message: 'Permission denied. Cannot write to this directory.' });
    } else if (err.code === 'ENOENT') {
      res.status(400).json({ valid: false, message: 'Invalid path. Parent directory does not exist.' });
    } else {
      res.status(400).json({ valid: false, message: err.message });
    }
  }
});

router.post('/validate-plex-url', async (req, res) => {
  const testUrl = (req.body && req.body.url) || '';
  if (!testUrl || typeof testUrl !== 'string') {
    logToFile('[VALIDATE-PLEX] 🛑 No URL provided', 'red');
    return res.status(400).json({ valid: false, message: 'No URL provided' });
  }
  logToFile(`[VALIDATE-PLEX] 🔗 Validating Plex URL: ${testUrl}`, 'cyan');
  try {
    const url = new URL(testUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol. Use http:// or https://');
    }
    const testEndpoint = `${url.origin}/identity`;
    const response = await axios.get(testEndpoint, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    if (response.status === 401) {
      logToFile('[VALIDATE-PLEX] ✅ Plex server found (authentication required)', 'green');
      res.status(200).json({ 
        valid: true, 
        message: 'Plex server found. Authentication will be required.',
        requiresAuth: true 
      });
    } else if (response.status === 200 && response.data) {
      logToFile('[VALIDATE-PLEX] ✅ Plex server accessible', 'green');
      res.status(200).json({ 
        valid: true, 
        message: 'Plex server is accessible',
        serverInfo: {
          machineIdentifier: response.data.MediaContainer?.machineIdentifier,
          version: response.data.MediaContainer?.version
        }
      });
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (err) {
    logToFile(`[VALIDATE-PLEX] 🛑 URL validation failed: ${err.message}`, 'red');
    if (err.code === 'ECONNREFUSED') {
      res.status(400).json({ valid: false, message: 'Connection refused. Server may be offline.' });
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      res.status(400).json({ valid: false, message: 'Server not reachable. Check URL and network.' });
    } else if (err.message.includes('Invalid URL')) {
      res.status(400).json({ valid: false, message: 'Invalid URL format' });
    } else {
      res.status(400).json({ valid: false, message: err.message });
    }
  }
});

router.post('/validate-plex-token', async (req, res) => {
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
      res.json({ valid: true });
    } else {
      res.json({ valid: false, message: 'Réponse invalide du serveur Plex' });
    }
  } catch (error) {
    res.json({ valid: false, message: 'Token invalide ou serveur inaccessible' });
  }
});

module.exports = router;
