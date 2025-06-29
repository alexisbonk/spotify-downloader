import axios from 'axios';

export const fetchQueue = () => axios.get('http://localhost:4000/queue');
export const fetchSettings = () => axios.get('http://localhost:4000/settings');
export const downloadItem = (item, type) => axios.post('http://localhost:4000/download', {
  url: item.external_urls.spotify,
  type,
  name: item.name,
});
export const searchSpotify = (query, type, accessToken) =>
  axios.get(`http://localhost:4000/search?q=${encodeURIComponent(query)}&type=${type}&access_token=${accessToken}`);
export const fetchArtistAlbums = (artistId, accessToken) =>
  axios.get(`http://localhost:4000/artist-albums/${artistId}?access_token=${accessToken}`);
export const fetchFriendPlaylists = (friendId, accessToken) =>
  axios.get(`http://localhost:4000/user-playlists/${friendId}?access_token=${accessToken}`);
export const cancelDownload = (id) =>
  axios.post('http://localhost:4000/cancel-download', { id });
export const updateSettings = (downloadPath) =>
  axios.post('http://localhost:4000/settings', { downloadPath });
export const resetQueue = () =>
  axios.post('http://localhost:4000/reset-queue');
