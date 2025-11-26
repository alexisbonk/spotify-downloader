const PlexApi = require('./plexApi');

const logToFile = require('../utils/logToFile');

async function syncPlexPlaylist({ spotifyTracks, plexConfig, playlistTitle }) {
  logToFile(`[PLEX_SYNC:${playlistTitle}] → Start sync`);
  const plex = new PlexApi(plexConfig);
  const ratingKeys = [];
  const notFound = [];
  const foundTracks = [];

  for (const track of spotifyTracks) {
    try {
      const results = await plex.searchTrack({ title: track.title, artist: track.artist });
      if (results.length > 0) {
        ratingKeys.push(results[0].ratingKey);
        foundTracks.push({
          title: track.title,
          artist: track.artist,
          ratingKey: results[0].ratingKey
        });
      } else {
        notFound.push({
          title: track.title,
          artist: track.artist,
          reason: 'Not found in Plex library'
        });
      }
    } catch(e) {
      notFound.push({
        title: track.title,
        artist: track.artist,
        reason: e.message || 'Search error'
      });
    }
  }

  logToFile(`[PLEX_SYNC:${playlistTitle}] → ${spotifyTracks.length} recherchés | ${ratingKeys.length} trouvés | ${notFound.length} non trouvés`);
  if (notFound.length > 0) {
    logToFile(`[PLEX_SYNC:${playlistTitle}] ❌ Non trouvés :\n  - ` + notFound.map(t => `${t.title} - ${t.artist}: ${t.reason}`).join('\n  - '), 'red');
  }
  if (ratingKeys.length > 0) {
    try {
      await plex.createPlaylist({ title: playlistTitle, ratingKeys, serverId: plexConfig.serverId });
      logToFile(`[PLEX_SYNC:${playlistTitle}] ✅ Playlist Plex créée avec ${ratingKeys.length} tracks`);
    } catch(e) {
      logToFile(`[PLEX_SYNC:${playlistTitle}] ❌ Erreur création playlist Plex: ${e && e.stack ? e.stack : e}`, 'red');
      throw new Error(`Failed to create Plex playlist: ${e.message}`);
    }
  } else {
    logToFile(`[PLEX_SYNC:${playlistTitle}] ❌ Aucun track trouvé`, 'red');
    throw new Error('No tracks found in Plex library');
  }

  return {
    ratingKeys,
    foundTracks,
    notFound,
    totalSearched: spotifyTracks.length,
    totalFound: ratingKeys.length,
    totalNotFound: notFound.length
  };
}

module.exports = syncPlexPlaylist;
