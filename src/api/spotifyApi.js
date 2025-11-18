import axios from 'axios';

export const fetchQueue = () => axios.get('http://localhost:4420/queue');
export const fetchSettings = () => axios.get('http://localhost:4420/settings');
export const downloadItem = (item, type) => axios.post('http://localhost:4420/download', {
  url: item.external_urls.spotify,
  type,
  name: item.name,
});
export const searchSpotify = (query, type, accessToken) =>
  axios.get(`http://localhost:4420/search?q=${encodeURIComponent(query)}&type=${type}&access_token=${accessToken}`);
export const fetchArtistAlbums = (artistId, accessToken) =>
  axios.get(`http://localhost:4420/artist-albums/${artistId}?access_token=${accessToken}`);
export const fetchFriendPlaylists = (friendId, accessToken) =>
  axios.get(`http://localhost:4420/user-playlists/${friendId}?access_token=${accessToken}`);
export const fetchAlbumTracks = (albumId, accessToken) =>
  axios.get(`http://localhost:4420/album-tracks/${albumId}?access_token=${accessToken}`);
export const fetchPlaylistTracks = (playlistId, accessToken) =>
  axios.get(`http://localhost:4420/playlist-tracks/${playlistId}?access_token=${accessToken}`);
export const cancelDownload = (id) =>
  axios.post('http://localhost:4420/cancel-download', { id });
export const updateSettings = (downloadPath, autoRefreshQueue, plexUrl) =>
  axios.post('http://localhost:4420/settings', { downloadPath, autoRefreshQueue, plexUrl });
export const resetQueue = () =>
  axios.post('http://localhost:4420/reset-queue');
