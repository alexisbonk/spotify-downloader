import React from 'react';
import '../styles/SearchResults.css';
import { FaDownload, FaSignOutAlt } from 'react-icons/fa';

const SearchResults = ({
  searchType,
  trackResults,
  albumResults,
  playlistResults,
  artistResults,
  selectedArtistAlbums,
  setSelectedArtistAlbums,
  handleArtistSelect,
  handleDownload
}) => {
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
          <li key={item.id}>
            {item.images?.[0] && (
              <img src={item.images[0].url} alt={item.name} className="spotify-img-thumb" />
            )}
            <div className="spotify-list-text">
              <span className="spotify-list-title">{item.name}</span>
              <span className="spotify-artist">{item.artists.map(artist => artist.name).join(', ')}</span>
              <button className="spotify-btn-main spotify-btn-download" onClick={() => handleDownload(item, 'album')}><FaDownload style={{marginRight: 4}}/>Download</button>
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
            <li key={item.id}>
              {item.images?.[0] && (
                <img src={item.images[0].url} alt={item.name} className="spotify-img-thumb" />
              )}
              <div className="spotify-list-text">
                <span className="spotify-list-title">{item.name}</span>
                <button className="spotify-btn-main spotify-btn-download" onClick={() => handleDownload(item, 'playlist')}><FaDownload style={{marginRight: 4}}/>Download</button>
              </div>
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
            <h3>Artists</h3>
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
            <h3>Albums</h3>
            <ul className="spotify-list">
              {selectedArtistAlbums.map((album) => (
                <li key={album.id}>
                  {album.images?.[0] && (
                    <img src={album.images[0].url} alt={album.name} className="spotify-img-thumb" />
                  )}
                  <div className="spotify-list-text">
                    <span className="spotify-list-title">{album.name}</span>
                    <button className="spotify-btn-main spotify-btn-download" onClick={() => handleDownload(album, 'album')}><FaDownload style={{marginRight: 4}}/>Download</button>
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
