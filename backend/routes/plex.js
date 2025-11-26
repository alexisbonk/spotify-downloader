const express = require('express');
const router = express.Router();
const axios = require('axios');
const logToFile = require('../utils/logToFile');
const syncPlexPlaylist = require('../services/syncPlexPlaylist');

router.post('/sync-plex-playlist', async (req, res) => {
  const settings = req.app.locals.settings;
  logToFile(`[PLEX_SYNC] Appel /sync-plex-playlist`);
  const { spotifyTracks, playlistTitle } = req.body;
  const plexUrl = settings.plexUrl || process.env.REACT_APP_PLEX_URL || process.env.PLEX_URL;
  const plexToken = settings.plexToken || process.env.REACT_APP_PLEX_TOKEN || process.env.PLEX_TOKEN;
  const plexServerId = settings.plexServerId || process.env.PLEX_SERVER_ID;

  if (!plexUrl || !plexToken || !plexServerId) {
    logToFile(`[PLEX_SYNC] Erreur: Configuration Plex manquante`);
    return res.status(400).json({ 
      error: 'Configuration Plex manquante',
      details: {
        hasUrl: !!plexUrl,
        hasToken: !!plexToken,
        hasServerId: !!plexServerId
      }
    });
  }

  if (!spotifyTracks || !Array.isArray(spotifyTracks) || spotifyTracks.length === 0) {
    logToFile(`[PLEX_SYNC] Erreur: Aucune piste fournie`);
    return res.status(400).json({ error: 'Aucune piste fournie' });
  }

  if (!playlistTitle) {
    logToFile(`[PLEX_SYNC] Erreur: Titre de la playlist manquant`);
    return res.status(400).json({ error: 'Titre de la playlist manquant' });
  }

  try {
    logToFile(`[PLEX_SYNC] Début de la synchronisation pour "${playlistTitle}" avec ${spotifyTracks.length} pistes`);
    const result = await syncPlexPlaylist(spotifyTracks, playlistTitle, plexUrl, plexToken, plexServerId);
    
    logToFile(`[PLEX_SYNC] Synchronisation terminée avec succès`);
    res.json(result);
  } catch (error) {
    logToFile(`[PLEX_SYNC] Erreur lors de la synchronisation: ${error.message}`);
    res.status(500).json({ 
      error: 'Erreur lors de la synchronisation avec Plex', 
      message: error.message 
    });
  }
});

router.post('/validate-plex-url', async (req, res) => {
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

module.exports = router;
