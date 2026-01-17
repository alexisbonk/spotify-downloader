import { useState, useCallback } from 'react';

export function useSpotifySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('track');
  const [trackResults, setTrackResults] = useState([]);
  const [albumResults, setAlbumResults] = useState([]);
  const [playlistResults, setPlaylistResults] = useState([]);
  const [artistResults, setArtistResults] = useState([]);
  const [selectedArtistAlbums, setSelectedArtistAlbums] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage] = useState('');
  const setFeedbackMessage = useCallback((message) => {
    if (message) {
      console.log(`[Feedback] ${message}`);
    }
  }, []);

  return {
    searchQuery, setSearchQuery,
    searchType, setSearchType,
    trackResults, setTrackResults,
    albumResults, setAlbumResults,
    playlistResults, setPlaylistResults,
    artistResults, setArtistResults,
    selectedArtistAlbums, setSelectedArtistAlbums,
    isLoading, setIsLoading,
    feedbackMessage, setFeedbackMessage
  };
}

export function useQueue() {
  const [queue, setQueue] = useState([]);
  return { queue, setQueue };
}

export function useFriendPlaylists() {
  const [friendId, setFriendId] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendPlaylists, setFriendPlaylists] = useState([]);
  const [friendError, setFriendError] = useState('');
  const [isFriendLoading, setIsFriendLoading] = useState(false);

  return {
    friendId, setFriendId,
    selectedFriend, setSelectedFriend,
    friendPlaylists, setFriendPlaylists,
    friendError, setFriendError,
    isFriendLoading, setIsFriendLoading
  };
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('mode') === 'dark');
  return { isDarkMode, setIsDarkMode };
}

export function useSettings() {
  const [showSettings, setShowSettings] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [plexUrl, setPlexUrl] = useState('');
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [spotifyRedirectUri, setSpotifyRedirectUri] = useState('http://127.0.0.1:8585/callback');
  const [plexToken, setPlexToken] = useState('');
  const [plexServerId, setPlexServerId] = useState('');
  return { 
    showSettings, setShowSettings, 
    downloadPath, setDownloadPath, 
    plexUrl, setPlexUrl,
    spotifyClientId, setSpotifyClientId,
    spotifyClientSecret, setSpotifyClientSecret,
    spotifyRedirectUri, setSpotifyRedirectUri,
    plexToken, setPlexToken,
    plexServerId, setPlexServerId
  };
}
