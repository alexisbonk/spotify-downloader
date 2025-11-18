import React from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import '../styles/SettingsModal.css';

const SettingsModal = ({ downloadPath, setDownloadPath, plexUrl, setPlexUrl, autoRefreshQueue, setAutoRefreshQueue, handlePathChange, onClose }) => {
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handlePathChange();
  };

  return (
    <div className="spotify-settings-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={handleBackdropClick}>
      <div className="spotify-settings-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="settings-modal-close" aria-label="Fermer les paramètres" onClick={onClose}>
          <FaTimes />
        </button>
        <div className="settings-modal-header">
          <h2>Paramètres NAS</h2>
        </div>
        <form className="settings-modal-body" onSubmit={handleSubmit}>
          <label className="settings-modal-field">
            <span>Chemin de téléchargement</span>
            <input
              type="text"
              value={downloadPath}
              onChange={(e) => setDownloadPath(e.target.value)}
              placeholder="\\\NAS\Main volume\MUSIC"
            />
          </label>
          <label className="settings-modal-field">
            <span>Plex URL</span>
            <input
              type="text"
              value={plexUrl}
              onChange={(e) => setPlexUrl(e.target.value)}
              placeholder="http://192.168.1.22:32400"
            />
          </label>
          <label className="settings-modal-toggle">
            <input
              type="checkbox"
              checked={autoRefreshQueue}
              onChange={(e) => setAutoRefreshQueue(e.target.checked)}
            />
            <span>Rafraîchir automatiquement la file d'attente</span>
          </label>
          <div className="settings-modal-actions">
            <button type="button" className="settings-btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="spotify-btn-main settings-btn-save">
              <FaSave style={{ marginRight: 6 }} /> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
