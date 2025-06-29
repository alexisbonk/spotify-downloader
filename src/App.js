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
import FriendPlaylists from './components/FriendPlaylists';
import Footer from './components/Footer';
import SearchResults from './components/SearchResults';
import QueuePanel from './components/QueuePanel';
import * as spotifyApi from './api/spotifyApi';
import { FaSpotify } from 'react-icons/fa';
import { useSpotifySearch, useFriendPlaylists, useSettings } from './hooks/useSpotify';
import useQueue from './hooks/useQueue';

function App() {
  const { queue, isLoading: isQueueLoading, fetchQueue } = useQueue();
  const { searchQuery, setSearchQuery, searchType, setSearchType, trackResults, setTrackResults, albumResults, setAlbumResults, playlistResults, setPlaylistResults, artistResults, setArtistResults, selectedArtistAlbums, setSelectedArtistAlbums, isLoading, setIsLoading, feedbackMessage, setFeedbackMessage } = useSpotifySearch();
  const { friendId, setFriendId, selectedFriend, setSelectedFriend, friendPlaylists, setFriendPlaylists, friendError, setFriendError, isFriendLoading, setIsFriendLoading } = useFriendPlaylists();
  const { showSettings, setShowSettings, downloadPath, setDownloadPath } = useSettings();
  const [accessToken, setAccessToken] = React.useState('');
  const [isQueuePanelOpen, setIsQueuePanelOpen] = React.useState(false);
  
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('access_token');
    if (token) {
      setAccessToken(token);
    }
    spotifyApi.fetchSettings().then(res => setDownloadPath(res.data.downloadPath));
  }, []);

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

  const handleSearch = () => {
    if (accessToken && searchQuery) {
      setIsLoading(true);
      setFeedbackMessage('Searching...');
      spotifyApi.searchSpotify(searchQuery, searchType, accessToken)
        .then(res => {
          switch (searchType) {
            case 'track':
              setTrackResults(res.data);
              break;
            case 'album':
              setAlbumResults(res.data);
              break;
            case 'playlist':
              setPlaylistResults(res.data);
              break;
            case 'artist':
              setSelectedArtistAlbums(null);
              setArtistResults(res.data);
              break;
            default:
              break;
          }
          setIsLoading(false);
          setFeedbackMessage('Search completed.');
        })
        .catch(err => {
          if (err.response && err.response.status === 401) {
            handleTokenExpiry();
          } else {
            console.error("Error searching: ", err);
          }
          setIsLoading(false);
          setFeedbackMessage('Error during search.');
        });
    }
  };

  const handleTokenExpiry = () => {
    setAccessToken('');
    window.location.href = 'http://localhost:4000/auth';
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

  const handleFriendSearch = () => {
    if (!friendId || !accessToken) return;
    setIsFriendLoading(true);
    setFriendError('');
    setSelectedFriend(null);
    setFriendPlaylists([]);
    spotifyApi.fetchFriendPlaylists(friendId, accessToken)
      .then(res => {
        setSelectedFriend({ id: friendId });
        setFriendPlaylists(res.data);
        setIsFriendLoading(false);
        if (res.data.length === 0) setFriendError('No playlists found for this user.');
      })
      .catch(() => {
        setFriendError('Could not fetch playlists for this user.');
        setIsFriendLoading(false);
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

  const handlePathChange = () => {
    spotifyApi.updateSettings(downloadPath).then(() => {
      setFeedbackMessage('Download path saved.');
    }).catch(err => {
      console.error("Error saving path: ", err);
      setFeedbackMessage('Error saving download path.');
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
            <a href="http://localhost:4000/auth" className="spotify-btn-main">
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              isLoading={isLoading}
              friendId={friendId}
              setFriendId={setFriendId}
              handleFriendSearch={handleFriendSearch}
              isFriendLoading={isFriendLoading}
              friendError={friendError}
              showFriendButton={searchType === 'playlist'}
              showFriendPlaylists={!!selectedFriend && friendPlaylists.length > 0}
              onShowFriendPlaylists={() => {}}
            />
            <section className="spotify-content">
              {showSettings && (
                <SettingsModal
                  downloadPath={downloadPath}
                  setDownloadPath={setDownloadPath}
                  handlePathChange={handlePathChange}
                />
              )}
              {searchType === 'playlist' && selectedFriend && friendPlaylists.length > 0 && (
                <FriendPlaylists
                  selectedFriend={selectedFriend}
                  friendPlaylists={friendPlaylists}
                  handleDownload={handleDownload}
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
              />
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
