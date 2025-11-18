import React from 'react';
import '../styles/FriendPlaylists.css';
import { FaDownload } from 'react-icons/fa';

const FriendPlaylists = ({ selectedFriend, friendPlaylists, handleDownload, handleSyncPlexPlaylist }) => (
  <div className="spotify-friend-playlists">
    <h4>Playlists of {selectedFriend.id}</h4>
    <ul>
      {friendPlaylists.map(pl => (
        <li key={pl.id}>
          {pl.images?.[0] && (
            <img src={pl.images[0].url} alt={pl.name} className="spotify-img-thumb" />
          )}
          <span>{pl.name}</span>
          <button className="spotify-btn-main" onClick={() => handleDownload(pl, 'playlist')}><FaDownload /></button>
          <button className="spotify-btn-main" onClick={() => handleSyncPlexPlaylist(pl)}>Sync Plex</button>
        </li>
      ))}
    </ul>
  </div>
);

export default FriendPlaylists;
