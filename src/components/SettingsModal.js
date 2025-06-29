import React from 'react';
import '../styles/SettingsModal.css';

const SettingsModal = ({ downloadPath, setDownloadPath, handlePathChange }) => (
  <div className="spotify-settings-modal">
    <input
      type="text"
      value={downloadPath}
      onChange={(e) => setDownloadPath(e.target.value)}
      placeholder="Path to NAS"
    />
    <button className="spotify-btn-main" onClick={handlePathChange}>Save</button>
  </div>
);

export default SettingsModal;
