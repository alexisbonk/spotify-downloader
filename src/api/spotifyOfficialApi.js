import axios from 'axios';

export function searchSpotifyApi(query, type, accessToken) {
  return axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}`,
    { headers: { Authorization: `Bearer ${accessToken}` } });
}

export function getArtistAlbums(artistId, accessToken) {
  return axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`,
    { headers: { Authorization: `Bearer ${accessToken}` } });
}

export function getUserPlaylists(userId, accessToken) {
  return axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`,
    { headers: { Authorization: `Bearer ${accessToken}` } });
}