class PlexApi {
  constructor({ baseUrl, token }) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  async searchTrack({ title, artist }) {
    const axios = require('axios');
    const url = `${this.baseUrl}/library/sections/1/all?type=10&title=${encodeURIComponent(title)}&artist.title=${encodeURIComponent(artist)}&X-Plex-Token=${this.token}`;
    const res = await axios.get(url);
    const results = res.data.MediaContainer.Metadata || [];
    console.log(`\n[searchTrack] Recherche: "${title}" par "${artist}" | Résultats trouvés: ${results.length}`);
    if (results.length > 0) {
      results.forEach((track, idx) => {
        const foundTitle = track.title || 'N/A';
        const foundArtist = track.originalTitle || track.grandparentTitle || 'N/A';
        console.log(`  - Résultat ${idx + 1}: "${foundTitle}" par "${foundArtist}"`);
      });
    } else {
      console.log('  Aucun résultat trouvé');
    }
    return results;
  }

  async createPlaylist({ title, ratingKeys, type = "audio", smart = false, serverId }) {
    const axios = require('axios');
    const uri = `server://${serverId}/com.plexapp.plugins.library/library/metadata/${ratingKeys.join(',')}`;
    const url = `${this.baseUrl}/playlists?title=${encodeURIComponent(title)}&type=${type}&smart=${smart ? 1 : 0}&X-Plex-Token=${this.token}&uri=${encodeURIComponent(uri)}`;
    const res = await axios.post(url, null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return res.data;
  }
}

module.exports = PlexApi;
