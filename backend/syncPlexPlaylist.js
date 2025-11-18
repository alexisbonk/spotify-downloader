const PlexApi = require('./plexApi');

const logToFile = require('./logToFile');

async function syncPlexPlaylist({ spotifyTracks, plexConfig, playlistTitle }) {
  logToFile(`[PLEX_SYNC:${playlistTitle}] → Start sync`);
  const plex = new PlexApi(plexConfig);
  const ratingKeys = [];
  const notFound = [];

  for (const track of spotifyTracks) {
    try {
      const results = await plex.searchTrack({ title: track.title, artist: track.artist });
      if (results.length > 0) {
        ratingKeys.push(results[0].ratingKey);
      } else {
        notFound.push(`${track.title} - ${track.artist}`);
      }
    } catch(e) {
      notFound.push(`${track.title} - ${track.artist} (ERREUR)`);
    }
  }

  logToFile(`[PLEX_SYNC:${playlistTitle}] → ${spotifyTracks.length} recherchés | ${ratingKeys.length} trouvés | ${notFound.length} non trouvés`);
  if (notFound.length > 0) {
    logToFile(`[PLEX_SYNC:${playlistTitle}] ❌ Non trouvés :\n  - ` + notFound.join('\n  - '), 'red');
  }
  if (ratingKeys.length > 0) {
    try {
      await plex.createPlaylist({ title: playlistTitle, ratingKeys, serverId: plexConfig.serverId });
      logToFile(`[PLEX_SYNC:${playlistTitle}] ✅ Playlist Plex créée avec ${ratingKeys.length} tracks`);
    } catch(e) {
      logToFile(`[PLEX_SYNC:${playlistTitle}] ❌ Erreur création playlist Plex: ${e && e.stack ? e.stack : e}`, 'red');
    }
  } else {
    logToFile(`[PLEX_SYNC:${playlistTitle}] ❌ Aucun track trouvé`, 'red');
  }

  return ratingKeys;
}

module.exports = syncPlexPlaylist;
