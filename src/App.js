import React, { useEffect } from 'react';
import './styles/App.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/700.css';
import { IconContext } from 'react-icons';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

import axios from 'axios';
import Footer from './components/Footer';
import SearchResults from './components/SearchResults';
import QueuePanel from './components/QueuePanel';
import AlbumPreviewModal from './components/AlbumPreviewModal';
import * as spotifyApi from './api/spotifyApi';
import { FaSpotify } from 'react-icons/fa';
import { useSpotifySearch, useSettings } from './hooks/useSpotify';
import useQueue from './hooks/useQueue';

const SEARCH_STATE_KEY = 'spotifyDownloaderSearchState';

function AppContent() {
  const { t } = useLanguage();
  const [searchMode, setSearchMode] = React.useState('playlist');
  
  const [autoRefreshQueue, setAutoRefreshQueue] = React.useState(() => {
    const saved = localStorage.getItem('autoRefreshQueue');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [refreshInterval, setRefreshInterval] = React.useState(5000);
  const { queue, isLoading: isQueueLoading, isBackendOnline, connectionError, fetchQueue } = useQueue(refreshInterval, autoRefreshQueue);
  const { searchQuery, setSearchQuery, searchType, setSearchType, trackResults, setTrackResults, albumResults, setAlbumResults, playlistResults, setPlaylistResults, artistResults, setArtistResults, selectedArtistAlbums, setSelectedArtistAlbums, isLoading, setIsLoading, feedbackMessage, setFeedbackMessage } = useSpotifySearch();
  
  const { showSettings, setShowSettings, downloadPath, setDownloadPath, plexUrl, setPlexUrl, spotifyClientId, setSpotifyClientId, spotifyClientSecret, setSpotifyClientSecret, spotifyRedirectUri, setSpotifyRedirectUri, plexToken, setPlexToken, plexServerId, setPlexServerId } = useSettings();
  const [accessToken, setAccessToken] = React.useState('');
  const [isQueuePanelOpen, setIsQueuePanelOpen] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState(null);
  const [previewTracks, setPreviewTracks] = React.useState([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = React.useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
        if (parsed.searchType !== undefined) setSearchType(parsed.searchType);
        if (parsed.searchMode !== undefined) setSearchMode(parsed.searchMode);
        if (parsed.friendSearchQuery !== undefined) setFriendSearchQuery(parsed.friendSearchQuery);
        if (parsed.trackResults !== undefined) setTrackResults(parsed.trackResults);
        if (parsed.albumResults !== undefined) setAlbumResults(parsed.albumResults);
        if (parsed.playlistResults !== undefined) setPlaylistResults(parsed.playlistResults);
        if (parsed.artistResults !== undefined) setArtistResults(parsed.artistResults);
      }
    } catch (e) {
      console.error('Failed to parse search state', e);
    }

    const token = new URLSearchParams(window.location.search).get('access_token');
    if (token) {
      setAccessToken(token);
    }
    spotifyApi.fetchSettings().then(res => {
      if (res.data.downloadPath !== undefined) {
        setDownloadPath(res.data.downloadPath);
      }
      if (res.data.autoRefreshQueue !== undefined && autoRefreshQueue === true) {
        if (res.data.autoRefreshQueue === false) {
          setAutoRefreshQueue(false);
        }
      }
      if (res.data.refreshInterval !== undefined) {
        setRefreshInterval(res.data.refreshInterval);
      }
      if (res.data.plexUrl !== undefined) {
        setPlexUrl(res.data.plexUrl || '');
      }
      if (res.data.spotifyClientId !== undefined) {
        setSpotifyClientId(res.data.spotifyClientId || '');
      }
      if (res.data.spotifyClientSecret !== undefined) {
        setSpotifyClientSecret(res.data.spotifyClientSecret || '');
      }
      if (res.data.spotifyRedirectUri !== undefined) {
        setSpotifyRedirectUri(res.data.spotifyRedirectUri || 'http://127.0.0.1:8585/callback');
      }
      if (res.data.plexToken !== undefined) {
        setPlexToken(res.data.plexToken || '');
      }
      if (res.data.plexServerId !== undefined) {
        setPlexServerId(res.data.plexServerId || '');
      }
    }).catch(err => {
      if (err.code !== 'ERR_NETWORK' && err.code !== 'ECONNABORTED') {
        console.error('Error fetching settings:', err);
      }
    });
  }, [setAccessToken, setDownloadPath, autoRefreshQueue, setAutoRefreshQueue, setPlexUrl, setSpotifyClientId, setSpotifyClientSecret, setSpotifyRedirectUri, setPlexToken, setPlexServerId, setSearchQuery, setSearchType, setSearchMode, setTrackResults, setAlbumResults, setPlaylistResults, setArtistResults]);

  const [isHydrated, setIsHydrated] = React.useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const stateToPersist = {
      searchQuery,
      searchType,
      searchMode,
      trackResults,
      albumResults,
      playlistResults,
      artistResults,
      friendSearchQuery,
    };

    try {
      localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.error('Failed to persist search state', e);
    }
  }, [isHydrated, searchQuery, searchType, searchMode, trackResults, albumResults, playlistResults, artistResults, friendSearchQuery]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('autoRefreshQueue', JSON.stringify(autoRefreshQueue));
  }, [autoRefreshQueue]);

  const activeSearchValue =
    searchType === 'playlist' && searchMode === 'friend' ? friendSearchQuery : searchQuery;

  const handleSearchInputChange = (value) => {
    if (searchType === 'playlist' && searchMode === 'friend') {
      setFriendSearchQuery(value);
    } else {
      setSearchQuery(value);
    }
  };

  const handleDownload = (item, type) => {
    if (accessToken && item) {
      setIsLoading(true);
      setFeedbackMessage('Starting download...');
      spotifyApi.downloadItem(item, type).then(() => {
        fetchQueue();
        setIsLoading(false);
        setFeedbackMessage('Download started.');
      }).catch(err => {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setFeedbackMessage('Backend server is offline. Please start the backend server.');
        } else {
          console.error("Error downloading: ", err);
          setFeedbackMessage('Error starting download.');
        }
        setIsLoading(false);
      });
    }
  };

  const handlePreview = async (item, type = 'album') => {
    if (!item || !accessToken) return;
    setShowPreview(true);
    setPreviewItem({ ...item, __previewType: type });
    setPreviewTracks([]);
    setIsPreviewLoading(true);
    try {
      if (type === 'playlist') {
        const res = await spotifyApi.fetchPlaylistTracks(item.id, accessToken);
        const normalized = res.data.map((entry) => {
          const track = entry.track || entry;
          return {
            id: track.id || `${item.id}-${track.name}`,
            name: track.name,
            artists: track.artists || [],
            duration_ms: track.duration_ms,
          };
        });
        setPreviewTracks(normalized);
      } else {
        const res = await spotifyApi.fetchAlbumTracks(item.id, accessToken);
        setPreviewTracks(res.data || []);
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setPreviewTracks([]);
      } else {
        console.error('Error fetching preview tracks: ', err);
        setPreviewTracks([]);
      }
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewItem(null);
    setPreviewTracks([]);
  };

  const handleSearch = () => {
    const inputValue = activeSearchValue;
    if (!accessToken || !inputValue) return;
    setIsLoading(true);
    setFeedbackMessage(null);
    const finishLoading = () => setIsLoading(false);

    if (searchType === 'playlist' && searchMode === 'friend') {
      spotifyApi.fetchFriendPlaylists(inputValue, accessToken)
        .then(res => {
          const playlists = res.data?.items || [];
          setPlaylistResults(playlists);
          setFeedbackMessage(playlists.length === 0 ? 'No playlists found for this user.' : null);
        })
        .catch((error) => {
          if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            setPlaylistResults([]);
            setFeedbackMessage('Backend server is offline. Please start the backend server.');
          } else {
            console.error('Error fetching friend playlists:', error);
            setPlaylistResults([]);
            setFeedbackMessage('Unable to fetch playlists for this user.');
          }
        })
        .finally(finishLoading);
      return;
    }

    spotifyApi.searchSpotify(inputValue, searchType, accessToken)
      .then(res => {
        const data = res.data || [];
        if (searchType === 'track') {
          setTrackResults(data);
        } else if (searchType === 'album') {
          setAlbumResults(data);
        } else if (searchType === 'playlist') {
          setPlaylistResults(data);
        } else if (searchType === 'artist') {
          setArtistResults(data);
          setSelectedArtistAlbums(null);
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setFeedbackMessage('Backend server is offline. Please start the backend server.');
        } else {
          console.error("Error searching: ", err);
          setFeedbackMessage('Error during search.');
        }
      })
      .finally(finishLoading);
  };

  const handleTokenExpiry = () => {
    setAccessToken('');
    window.location.href = 'http://127.0.0.1:8585/auth';
  };

  const handleArtistSelect = (artistId) => {
    setIsLoading(true);
    setFeedbackMessage('Fetching albums...');
    spotifyApi.fetchArtistAlbums(artistId, accessToken)
      .then(res => {
        setSelectedArtistAlbums(res.data.items || []);
        setIsLoading(false);
        setFeedbackMessage('Albums loaded.');
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setFeedbackMessage('Backend server is offline. Please start the backend server.');
        } else {
          console.error("Error fetching albums: ", err);
          setFeedbackMessage('Error fetching albums.');
        }
        setIsLoading(false);
      });
  };

  const handleCancelDownload = (id) => {
    setIsLoading(true);
    spotifyApi.cancelDownload(id).then(() => {
      fetchQueue();
      setIsLoading(false);
      setFeedbackMessage('Download cancelled.');
    }).catch(err => {
      if (err.response && err.response.status === 401) {
        handleTokenExpiry();
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setFeedbackMessage('Backend server is offline. Please start the backend server.');
      } else {
        console.error("Error canceling download: ", err);
        setFeedbackMessage('Error cancelling download.');
      }
      setIsLoading(false);
    });
  };

  const handleSyncPlexPlaylist = async (playlist) => {
    setIsLoading(true);
    setFeedbackMessage('Syncing playlist to Plex...');
    try {
      let tracks = Array.isArray(playlist.tracks) ? playlist.tracks : null;
      if (!tracks) {
        const res = await axios.get(`http://localhost:8585/playlist-tracks/${playlist.id}?access_token=${accessToken}`);
        tracks = res.data.map(item => {
          const t = item.track || item;
          return {
            title: t.name,
            artist: t.artists && t.artists.length > 0 ? t.artists[0].name : ''
          };
        });
      }
      await axios.post('http://localhost:8585/sync-plex-playlist', {
        spotifyTracks: tracks,
        playlistTitle: playlist.name
      });
      setFeedbackMessage('Playlist synced to Plex.');
    } catch (e) {
      setFeedbackMessage('Error syncing playlist.');
    }
    setIsLoading(false);
  };



  const handlePathChange = () => {
    return spotifyApi.updateSettings(downloadPath, undefined, refreshInterval, plexUrl, spotifyClientId, spotifyClientSecret, spotifyRedirectUri, plexToken, plexServerId)
      .then(() => {
        setFeedbackMessage('Settings saved.');
        return { ok: true };
      })
      .catch(err => {
        if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setFeedbackMessage('Backend server is offline. Settings not saved.');
        } else {
          console.error("Error saving settings: ", err);
          setFeedbackMessage('Error saving settings.');
        }
        throw err;
      });
  };

  const handleResetQueue = () => {
    if (window.confirm('Are you sure you want to reset the queue?')) {
      setIsLoading(true);
      spotifyApi.resetQueue().then(() => {
        fetchQueue();
        setIsLoading(false);
        setFeedbackMessage('Queue reset.');
      }).catch(err => {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
          setFeedbackMessage('Backend server is offline. Queue not reset.');
        } else {
          console.error("Error resetting queue: ", err);
          setFeedbackMessage('Error resetting queue.');
        }
        setIsLoading(false);
      });
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <IconContext.Provider value={{ size: '1.3em' }}>
      {!accessToken ? (
        <div className="spotify-login-bg">
          <div className="spotify-login-card">
            <FaSpotify size={38} color="#1DB954" />
            <h2>Connect to Spotify</h2>
            <a href="http://localhost:8585/auth" className="spotify-btn-main">
              Login with Spotify
            </a>
          </div>
        </div>
      ) : (
        <div className="spotify-app-outer">
          <Sidebar
            searchType={searchType}
            setSearchType={setSearchType}
            toggleSettings={toggleSettings}
          />
          <main className="spotify-main">
            <Header
              searchQuery={activeSearchValue}
              setSearchQuery={handleSearchInputChange}
              searchMode={searchMode}
              setSearchMode={setSearchMode}
              searchType={searchType}
              handleSearch={handleSearch}
              isLoading={isLoading}
            />
            <section className="spotify-content">
              {showSettings && (
                <SettingsModal
                  downloadPath={downloadPath}
                  setDownloadPath={setDownloadPath}
                  plexUrl={plexUrl}
                  setPlexUrl={setPlexUrl}
                  autoRefreshQueue={autoRefreshQueue}
                  setAutoRefreshQueue={setAutoRefreshQueue}
                  refreshInterval={refreshInterval}
                  setRefreshInterval={setRefreshInterval}
                  spotifyClientId={spotifyClientId}
                  setSpotifyClientId={setSpotifyClientId}
                  spotifyClientSecret={spotifyClientSecret}
                  setSpotifyClientSecret={setSpotifyClientSecret}
                  spotifyRedirectUri={spotifyRedirectUri}
                  setSpotifyRedirectUri={setSpotifyRedirectUri}
                  plexToken={plexToken}
                  setPlexToken={setPlexToken}
                  plexServerId={plexServerId}
                  setPlexServerId={setPlexServerId}
                  handlePathChange={handlePathChange}
                  onClose={() => setShowSettings(false)}
                />
              )}

              <SearchResults
                searchType={searchType}
                trackResults={trackResults}
                albumResults={albumResults}
                playlistResults={playlistResults}
                artistResults={artistResults}
                selectedArtistAlbums={selectedArtistAlbums}
                setSelectedArtistAlbums={setSelectedArtistAlbums}
                handleArtistSelect={handleArtistSelect}
                handleDownload={handleDownload}
                handleSyncPlexPlaylist={handleSyncPlexPlaylist}
                handleOpenPreview={handlePreview}
                isLoading={isLoading}
                t={t}
              />
              {showPreview && (
                <AlbumPreviewModal
                  item={previewItem}
                  tracks={previewTracks}
                  isLoading={isPreviewLoading}
                  onClose={handleClosePreview}
                  onDownload={() => {
                    if (!previewItem) return;
                    const type = previewItem.__previewType || 'album';
                    handleDownload(previewItem, type);
                    handleClosePreview()
                  }}
                />
              )}
            </section>
            <Footer feedbackMessage={feedbackMessage} />
            <div
              className="queue-panel-hover-area"
              onMouseEnter={() => setIsQueuePanelOpen(true)}
              onMouseLeave={() => setIsQueuePanelOpen(false)}
              style={{ position: 'fixed', bottom: 36, right: 36, zIndex: 1300 }}
            >
              <QueuePanel
                isOpen={isQueuePanelOpen}
                onClose={() => setIsQueuePanelOpen(false)}
                queue={queue}
                fetchQueue={fetchQueue}
                handleCancelDownload={handleCancelDownload}
                handleResetQueue={handleResetQueue}
                isLoading={isQueueLoading}
                isBackendOnline={isBackendOnline}
                connectionError={connectionError}
              />
            </div>
          </main>
        </div>
      )}
    </IconContext.Provider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
