import React from 'react';
import '../styles/Sidebar.css';
import { FaSpotify, FaMusic, FaCompactDisc, FaListUl, FaUser, FaCog } from 'react-icons/fa';

const Sidebar = ({
  searchType,
  setSearchType,
  toggleSettings
}) => (
  <aside className="spotify-sidebar">
    <div className="spotify-sidebar-logo"><FaSpotify size={38} color="#1DB954" /><span>Spotify Downloader</span></div>
    <nav className="spotify-sidebar-nav">
      <button className={searchType === 'track' ? 'active' : ''} onClick={() => setSearchType('track')}><FaMusic />Tracks</button>
      <button className={searchType === 'album' ? 'active' : ''} onClick={() => setSearchType('album')}><FaCompactDisc />Albums</button>
      <button className={searchType === 'playlist' ? 'active' : ''} onClick={() => setSearchType('playlist')}><FaListUl />Playlists</button>
      <button className={searchType === 'artist' ? 'active' : ''} onClick={() => setSearchType('artist')}><FaUser />Artists</button>
      <button onClick={toggleSettings}><FaCog />Settings</button>
    </nav>
  </aside>
);

export default Sidebar;
