const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const axios = require('axios');
const logToFile = require('../utils/logToFile');

router.get('/auth', (req, res) => {
  const settings = req.app.locals.settings;
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

router.get('/callback', async (req, res) => {
  const settings = req.app.locals.settings;
  const code = req.query.code || null;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const payload = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: settings.spotifyRedirectUri
  });
  const authString = Buffer.from(settings.spotifyClientId + ':' + settings.spotifyClientSecret).toString('base64');
  const headers = {
    'Authorization': 'Basic ' + authString,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  try {
    const response = await axios.post(tokenUrl, payload, { headers });
    const { access_token, refresh_token } = response.data;
    const frontendUrl = new URL('http://localhost:3000');
    try {
      const referer = req.get('referer');
      if (referer) {
        const refererUrl = new URL(referer);
        frontendUrl.protocol = refererUrl.protocol;
        frontendUrl.host = refererUrl.host;
      }
    } catch (e) {
      console.error('Error parsing referer URL, using default frontend URL');
    }
    logToFile(`[AUTH] ✅ Auth callback success → Redirecting to frontend at ${frontendUrl.toString()}`, 'green');
    res.redirect(`${frontendUrl.toString()}?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (err) {
    logToFile('[AUTH] 🛑 Auth callback failed', 'red');
    res.status(500).send('Authentication failed');
  }
});

router.get('/search', async (req, res) => {
  const { q, type, access_token } = req.query;
  if (!q || !type || !access_token) {
    return res.status(400).send('Missing q, type, or access_token');
  }
  const searchUrl = 'https://api.spotify.com/v1/search';
  const headers = { Authorization: `Bearer ${access_token}` };
  const params = { q, type };
  logToFile(`[SEARCH] 🔍 Searching for "${q}" (type: ${type})`, 'cyan');
  try {
    const response = await axios.get(searchUrl, { headers, params });
    const results = response.data;
    const itemsKey = type + 's';
    const items = results[itemsKey]?.items || [];
    logToFile(`[SEARCH] ✅ Search completed → Found ${items.length} ${type}(s)`, 'green');
    res.status(200).json(results);
  } catch (err) {
    logToFile(`[SEARCH] 🛑 Search failed: ${err.message}`, 'red');
    if (err.response?.status === 401) {
      res.status(401).json({ 
        error: 'Token expired', 
        message: 'Your Spotify session has expired. Please log in again.' 
      });
    } else if (err.response?.status === 429) {
      const retryAfter = err.response.headers['retry-after'] || 60;
      res.status(429).json({ 
        error: 'Rate limited', 
        retryAfter: parseInt(retryAfter),
        message: `Too many requests. Please wait ${retryAfter} seconds.` 
      });
    } else {
      res.status(500).json({ 
        error: 'Search failed', 
        message: err.message 
      });
    }
  }
});

router.get('/album-tracks/:albumId', async (req, res) => {
  const { albumId } = req.params;
  const { access_token } = req.query;
  if (!albumId || !access_token) {
    return res.status(400).send('Missing albumId or access_token');
  }
  logToFile(`[ALBUM-TRACKS] 💿 Fetching tracks for album: ${albumId}`, 'cyan');
  try {
    let allTracks = [];
    let hasMore = true;
    let offset = 0;
    const limit = 50;
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

router.get('/playlist-tracks/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const { access_token } = req.query;
  if (!playlistId || !access_token) {
    return res.status(400).send('Missing playlistId or access_token');
  }
  logToFile(`[PLAYLIST-TRACKS] 🎵 Fetching tracks for playlist: ${playlistId}`, 'cyan');
  try {
    let allTracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    let fetchedCount = 0;
    
    while (url) {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const tracks = response.data.items || [];
      allTracks = allTracks.concat(tracks);
      fetchedCount += tracks.length;
      
      logToFile(`[PLAYLIST-TRACKS] 📄 Fetched page with ${tracks.length} tracks (total: ${fetchedCount})`, 'cyan');
      
      url = response.data.next;
      
      if (url) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    logToFile(`[PLAYLIST-TRACKS] ✅ Fetched ${allTracks.length} total tracks from playlist`, 'green');
    res.status(200).json(allTracks);
  } catch (err) {
    logToFile(`[PLAYLIST-TRACKS] 🛑 Failed to fetch tracks for playlist: ${playlistId} - ${err.message}`, 'red');
    res.status(500).send('Failed to fetch playlist tracks');
  }
});

router.get('/artist-albums/:artistId', async (req, res) => {
  const { artistId } = req.params;
  const { access_token } = req.query;
  if (!artistId || !access_token) {
    return res.status(400).send('Missing artistId or access_token');
  }
  logToFile(`[ARTIST-ALBUMS] 🎤 Fetching albums for artist: ${artistId}`, 'cyan');
  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    res.status(200).json(response.data);
  } catch (err) {
    logToFile(`[ARTIST-ALBUMS] 🛑 Failed to fetch albums for artist: ${artistId}`, 'red');
    res.status(500).send('Failed to fetch artist albums');
  }
});

router.get('/user-playlists/:userId', async (req, res) => {
  const { userId } = req.params;
  const { access_token } = req.query;
  logToFile(`[USER-PLAYLISTS] 👥 Fetching playlists for user: ${userId}`, 'cyan');
  try {
    const response = await axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    res.status(200).json(response.data);
  } catch (err) {
    logToFile(`[USER-PLAYLISTS] 🛑 Failed to fetch playlists for user: ${userId}`, 'red');
    res.status(500).send('Failed to fetch user playlists');
  }
});

router.post('/validate-spotify-credentials', async (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ valid: false, message: 'Client ID et Client Secret requis' });
  }
  try {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials', 
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    if (response.data.access_token) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false, message: 'Réponse invalide de Spotify' });
    }
  } catch (error) {
    res.json({ valid: false, message: 'Client ID ou Client Secret invalide' });
  }
});

module.exports = router;
