import React from 'react';
import '../styles/SearchResults.css';
import { FaDownload, FaSignOutAlt } from 'react-icons/fa';
import { FaLink } from 'react-icons/fa';
import '../styles/ArtistAlbums.css';

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
  isLoading
}) => {
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
  if (searchType === 'track') {
    return (
      <ul className="spotify-list">
        {trackResults.map((track) => (
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
    );
  }
  if (searchType === 'album') {
    return (
      <ul className="spotify-list">
        {albumResults.map((item) => (
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
    );
  }
  if (searchType === 'playlist') {
    return (
      <ul className="spotify-list">
        {playlistResults.map((item) => (
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
                  if (window.confirm('Synchroniser cette playlist vers Plex ?\n\nCela va créer une playlist Plex avec les morceaux locaux correspondants.')) {
                    handleSyncPlexPlaylist(item);
                  }
                }}
              >
                <FaLink size={18} color="#E5A00D" />
              </button>
            </li>
          )
        ))}
      </ul>
    );
  }
  if (searchType === 'artist') {
    return (
      <div>
        {!selectedArtistAlbums ? (
          <>
            {artistResults && artistResults.length > 0 && (
              <h3>Artists</h3>
            )}
            <ul className="spotify-list">
              {artistResults.map((artist) => (
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
                  if (window.confirm(`Télécharger tous les albums (${selectedArtistAlbums.length}) ?`)) {
                    selectedArtistAlbums.forEach(album => {
                      handleDownload(album, 'album');
                    });
                  }
                }}
              >
                <FaDownload style={{marginRight: 4}}/>Télécharger tous les albums
              </button>
            </div>
            <ul className="spotify-list">
              {selectedArtistAlbums.map((album) => (
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
      </div>
    );
  }
  return null;
};

export default SearchResults;
