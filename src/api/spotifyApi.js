import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8585' : '/api',
  timeout: 10000,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      return Promise.reject(error);
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const fetchQueue = () => api.get('/queue');
export const fetchSettings = () => api.get('/settings');
export const downloadItem = (item, type) => api.post('/download', {
  url: item.external_urls.spotify,
  type,
  name: item.name,
  image: item.images?.[0]?.url || (item.album?.images?.[0]?.url) || null,
});
export const searchSpotify = (query, type, accessToken) =>
  api.get(`/search?q=${encodeURIComponent(query)}&type=${type}&access_token=${accessToken}`);
export const fetchArtistAlbums = (artistId, accessToken) =>
  api.get(`/artist-albums/${artistId}?access_token=${accessToken}`);
export const fetchFriendPlaylists = (friendId, accessToken) =>
  api.get(`/user-playlists/${friendId}?access_token=${accessToken}`);
export const fetchAlbumTracks = (albumId, accessToken) =>
  api.get(`/album-tracks/${albumId}?access_token=${accessToken}`);
export const fetchPlaylistTracks = (playlistId, accessToken) =>
  api.get(`/playlist-tracks/${playlistId}?access_token=${accessToken}`);
export const cancelDownload = (id) =>
  api.post('/cancel-download', { id });
export const updateSettings = (downloadPath, autoRefreshQueue, refreshInterval, plexUrl, spotifyClientId, spotifyClientSecret, spotifyRedirectUri, plexToken, plexServerId) => {
  const settings = {};
  
  if (downloadPath !== undefined && downloadPath !== '') settings.downloadPath = downloadPath;
  if (refreshInterval !== undefined && refreshInterval !== '') settings.refreshInterval = refreshInterval;
  if (plexUrl !== undefined && plexUrl !== '') settings.plexUrl = plexUrl;
  if (spotifyClientId !== undefined && spotifyClientId !== '') settings.spotifyClientId = spotifyClientId;
  if (spotifyClientSecret !== undefined && spotifyClientSecret !== '') settings.spotifyClientSecret = spotifyClientSecret;
  if (spotifyRedirectUri !== undefined && spotifyRedirectUri !== '') settings.spotifyRedirectUri = spotifyRedirectUri;
  if (plexToken !== undefined && plexToken !== '') settings.plexToken = plexToken;
  if (plexServerId !== undefined && plexServerId !== '') settings.plexServerId = plexServerId;
  
  return api.post('/settings', settings);
};
export const validatePath = (path) =>
  api.post('/validate-path', { path });
export const validatePlexUrl = (url) =>
  api.post('/validate-plex-url', { url });
export const validateSpotifyCredentials = (clientId, clientSecret) =>
  api.post('/validate-spotify-credentials', { clientId, clientSecret });
export const validatePlexToken = (token, plexUrl) =>
  api.post('/validate-plex-token', { token, plexUrl });
export const resetQueue = () =>
  api.post('/reset-queue');
