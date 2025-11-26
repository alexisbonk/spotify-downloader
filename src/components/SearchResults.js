import React, { useState } from 'react';
import '../styles/SearchResults.css';
import { FaDownload, FaSignOutAlt } from 'react-icons/fa';
import { FaLink } from 'react-icons/fa';
import '../styles/ArtistAlbums.css';
import ConfirmationModal from './ConfirmationModal';
import PlexSyncModal from './PlexSyncModal';

const SearchResults = ({
  searchType,
  trackResults,
  albumResults,
  playlistResults,
  artistResults,
  selectedArtistAlbums,
  setSelectedArtistAlbums,
  handleArtistSelect,
  handleDownload,
  handleSyncPlexPlaylist,
  handleOpenPreview,
  isLoading,
  t
}) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPlexSyncModal, setShowPlexSyncModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const openPreview = (item, type = 'album', event) => {
    if (!handleOpenPreview) return;
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    handleOpenPreview(item, type);
  };

  if (isLoading) {
    return (
      <div className="loader-centered loader-vertical">
        <div className="loader loader-large"></div>
      </div>
    );
  }
  
  let playlists = [];
  if (searchType === 'playlist') {
    if (Array.isArray(playlistResults)) {
      playlists = playlistResults;
    } else if (playlistResults && typeof playlistResults === 'object') {
      playlists = playlistResults.playlists?.items || [];
    }
  }
  
  return (
    <>
      {searchType === 'track' && (
        <ul className="spotify-list">
          {trackResults.tracks?.items?.map((track) => (
            <li key={track.id}>
              {track.album?.images?.[0] && (
                <img src={track.album.images[0].url} alt={track.name} className="spotify-img-thumb" />
              )}
              <div className="spotify-list-text">
                <span className="spotify-list-title">{track.name}</span>
                <span className="spotify-artist">{track.artists.map(a => a.name).join(', ')}</span>
                <br/><button className="spotify-btn-main spotify-btn-download" onClick={() => handleDownload(track, 'track')}><FaDownload style={{marginRight: 4}}/>Download</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {searchType === 'album' && (
        <ul className="spotify-list">
          {(albumResults.albums?.items || []).map((item) => (
            <li key={item.id} onClick={(e) => openPreview(item, 'album', e)}>
              {item.images?.[0] && (
                <img src={item.images[0].url} alt={item.name} className="spotify-img-thumb" />
              )}
              <div className="spotify-list-text">
                <span className="spotify-list-title">{item.name}</span>
                <span className="spotify-artist">{item.artists.map(artist => artist.name).join(', ')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {searchType === 'playlist' && (
        <ul className="spotify-list">
          {playlists.map((item) => (
            item && (
              <li key={item.id} style={{position: 'relative'}} onClick={(e) => openPreview(item, 'playlist', e)}>
                {item.images?.[0] && (
                  <img src={item.images[0].url} alt={item.name} className="spotify-img-thumb" />
                )}
                <div className="spotify-list-text">
                  <span className="spotify-list-title">{item.name}</span>
                  <span className="spotify-artist">{item.owner?.display_name}</span>
                </div>
                <button
                  className="spotify-btn-plex-sync"
                  style={{position: 'absolute', bottom: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.55, padding: 2}}
                  title="Synchroniser vers Plex"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setSelectedPlaylist(item);
                    setShowPlexSyncModal(true);
                  }}
                >
                  <FaLink size={18} color="#E5A00D" />
                </button>
              </li>
            )
          ))}
        </ul>
      )}
      {searchType === 'artist' && (
        <div>
          {!selectedArtistAlbums ? (
            <>
              {artistResults.artists?.items?.length > 0 && (
                <h3>Artists</h3>
              )}
              <ul className="spotify-list">
                {artistResults.artists?.items?.map((artist) => (
                  <li key={artist.id} onClick={() => handleArtistSelect(artist.id)} className="spotify-list-artist">
                    {artist.images?.[0] && (
                      <img src={artist.images[0].url} alt={artist.name} className="spotify-img-thumb" />
                    )}
                    <span>{artist.name}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <button className="spotify-btn-main" onClick={() => setSelectedArtistAlbums(null)}><FaSignOutAlt />Back</button>
              <div className="artist-header">
                <h3>Albums</h3>
                <button 
                  className="spotify-btn-main spotify-btn-download" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDownloadModal(true);
                  }}
                >
                  <FaDownload style={{marginRight: 4}}/>{t('downloadAllAlbums')}
                </button>
              </div>
              <ul className="spotify-list">
                {selectedArtistAlbums && Array.isArray(selectedArtistAlbums) && selectedArtistAlbums.map((album) => (
                  <li key={album.id} onClick={(e) => openPreview(album, 'album', e)}>
                    {album.images?.[0] && (
                      <img src={album.images[0].url} alt={album.name} className="spotify-img-thumb" />
                    )}
                    <div className="spotify-list-text">
                      <span className="spotify-list-title">{album.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <ConfirmationModal
            isOpen={showDownloadModal}
            onClose={() => setShowDownloadModal(false)}
            onConfirm={() => {
              selectedArtistAlbums && selectedArtistAlbums.forEach(album => {
                handleDownload(album, 'album');
              });
              setShowDownloadModal(false);
            }}
            albumCount={selectedArtistAlbums?.length || 0}
            showWarning={true}
          />
        </div>
      )}
      
      <PlexSyncModal
        isOpen={showPlexSyncModal}
        onClose={() => {
          setShowPlexSyncModal(false);
          setSelectedPlaylist(null);
        }}
        onConfirm={() => {
          if (selectedPlaylist) {
            handleSyncPlexPlaylist(selectedPlaylist);
            setShowPlexSyncModal(false);
            setSelectedPlaylist(null);
          }
        }}
        playlistName={selectedPlaylist?.name}
      />
    </>
  );
};

export default SearchResults;
