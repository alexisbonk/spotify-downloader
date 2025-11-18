import React from 'react';
import '../styles/Header.css';
import { FaSearch } from 'react-icons/fa';

const Header = ({
  searchQuery,
  setSearchQuery,
  searchMode,
  setSearchMode,
  searchType,
  handleSearch,
  isLoading
}) => (
  <header className="spotify-header">
    <div className="spotify-header-search">
      <FaSearch />
      {searchType === 'playlist' && (
        <select
          className="spotify-search-type-select"
          value={searchMode}
          onChange={e => setSearchMode(e.target.value)}
          style={{marginRight: 10, borderRadius: 8, border: 'none', padding: '7px 10px', background: '#282828', color: '#fff'}}
        >
          <option value="playlist">By name</option>
          <option value="friend">By friend</option>
        </select>
      )}
      <input
        className="spotify-search-input"
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder={
  searchType === 'playlist'
    ? (searchMode === 'friend' ? 'Spotify username' : 'Search for a playlist')
    : searchType === 'track'
      ? 'Search for a track'
      : searchType === 'album'
        ? 'Search for an album'
        : searchType === 'artist'
          ? 'Search for an artist'
          : 'Search'
}
        onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
      />
      <button className="spotify-btn-main" onClick={handleSearch} disabled={isLoading}>
        Search
      </button>
      
    </div>
  </header>
);

export default Header;
