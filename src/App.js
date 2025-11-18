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

function App() {
  const [searchMode, setSearchMode] = React.useState('playlist');
  const [autoRefreshQueue, setAutoRefreshQueue] = React.useState(true);
  const { queue, isLoading: isQueueLoading, fetchQueue } = useQueue(5000, autoRefreshQueue);
  const { searchQuery, setSearchQuery, searchType, setSearchType, trackResults, setTrackResults, albumResults, setAlbumResults, playlistResults, setPlaylistResults, artistResults, setArtistResults, selectedArtistAlbums, setSelectedArtistAlbums, isLoading, setIsLoading, feedbackMessage, setFeedbackMessage } = useSpotifySearch();
  
  const { showSettings, setShowSettings, downloadPath, setDownloadPath, plexUrl, setPlexUrl } = useSettings();
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
        if (Array.isArray(parsed.trackResults)) setTrackResults(parsed.trackResults);
        if (Array.isArray(parsed.albumResults)) setAlbumResults(parsed.albumResults);
        if (Array.isArray(parsed.playlistResults)) setPlaylistResults(parsed.playlistResults);
        if (Array.isArray(parsed.artistResults)) setArtistResults(parsed.artistResults);
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
      if (res.data.autoRefreshQueue !== undefined) {
        setAutoRefreshQueue(res.data.autoRefreshQueue !== false);
      }
      if (res.data.plexUrl !== undefined) {
        setPlexUrl(res.data.plexUrl || '');
      }
    });
  }, [setAccessToken, setDownloadPath, setAutoRefreshQueue, setPlexUrl, setSearchQuery, setSearchType, setSearchMode, setTrackResults, setAlbumResults, setPlaylistResults, setArtistResults]);

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
        } else {
          console.error("Error downloading: ", err);
        }
        setIsLoading(false);
        setFeedbackMessage('Error starting download.');
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
      console.error('Error fetching preview tracks: ', err);
      setPreviewTracks([]);
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
          setPlaylistResults(res.data || []);
          setFeedbackMessage(res.data.length === 0 && 'No playlists found for this user.');
        })
        .catch(() => {
          setFeedbackMessage('Could not retrieve playlists for this user.');
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
        } else {
          console.error("Error searching: ", err);
        }
        setFeedbackMessage('Error during search.');
      })
      .finally(finishLoading);
  };

  const handleTokenExpiry = () => {
    setAccessToken('');
    window.location.href = 'http://localhost:4420/auth';
  };

  const handleArtistSelect = (artistId) => {
    setIsLoading(true);
    setFeedbackMessage('Fetching albums...');
    spotifyApi.fetchArtistAlbums(artistId, accessToken)
      .then(res => {
        setSelectedArtistAlbums(res.data);
        setIsLoading(false);
        setFeedbackMessage('Albums loaded.');
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        } else {
          console.error("Error fetching albums: ", err);
        }
        setIsLoading(false);
        setFeedbackMessage('Error fetching albums.');
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
      } else {
        console.error("Error canceling download: ", err);
      }
      setIsLoading(false);
      setFeedbackMessage('Error cancelling download.');
    });
  };

  const handleSyncPlexPlaylist = async (playlist) => {
    setIsLoading(true);
    setFeedbackMessage('Syncing playlist to Plex...');
    try {
      let tracks = Array.isArray(playlist.tracks) ? playlist.tracks : null;
      if (!tracks) {
        const res = await axios.get(`http://localhost:4420/playlist-tracks/${playlist.id}?access_token=${accessToken}`);
        tracks = res.data.map(item => {
          const t = item.track || item;
          return {
            title: t.name,
            artist: t.artists && t.artists.length > 0 ? t.artists[0].name : ''
          };
        });
      }
      await axios.post('http://localhost:4420/sync-plex-playlist', {
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
    spotifyApi.updateSettings(downloadPath, autoRefreshQueue, plexUrl).then(() => {
      setFeedbackMessage('Settings saved.');
    }).catch(err => {
      console.error("Error saving settings: ", err);
      setFeedbackMessage('Error saving settings.');
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
        } else {
          console.error("Error resetting queue: ", err);
        }
        setIsLoading(false);
        setFeedbackMessage('Error resetting queue.');
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
            <a href="http://localhost:4420/auth" className="spotify-btn-main">
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
              />
            </div>
          </main>
        </div>
      )}
    </IconContext.Provider>
  );
}

export default App;
