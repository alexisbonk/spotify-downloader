import React from 'react';
import '../styles/Header.css';
import { FaSearch, FaUserFriends } from 'react-icons/fa';

const Header = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isLoading,
  friendId,
  setFriendId,
  handleFriendSearch,
  isFriendLoading,
  friendError,
  showFriendButton,
  showFriendPlaylists,
  onShowFriendPlaylists
}) => (
  <header className="spotify-header">
    <div className="spotify-header-search">
      <FaSearch />
      <input
        className="spotify-search-input"
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for a track, album, playlist or artist"
        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
      />
      <button className="spotify-btn-main" onClick={handleSearch}>Search</button>
      {showFriendButton && (
        <button className="spotify-btn-main" onClick={handleFriendSearch} style={{marginLeft: 8}}>
          <FaUserFriends /> Voir playlists de l'ami
        </button>
      )}
      {isLoading && <div className="loader"></div>}
    </div>
    {showFriendButton && (
      <div className="spotify-header-friend">
        <FaUserFriends />
        <input
          className="spotify-friend-input"
          type="text"
          value={friendId}
          onChange={e => setFriendId(e.target.value)}
          placeholder="Friend's Spotify username or ID"
        />
        {isFriendLoading && <div className="loader"></div>}
        {friendError && <div className="spotify-error">{friendError}</div>}
      </div>
    )}
  </header>
);

export default Header;
