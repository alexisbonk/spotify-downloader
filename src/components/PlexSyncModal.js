import React from 'react';
import { FaLink, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/ConfirmationModal.css';
import { useLanguage } from '../contexts/LanguageContext';

const PlexSyncModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  playlistName
}) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <FaLink className="modal-icon" style={{ color: '#E5A00D' }} />
            {t('syncPlaylistToPlex')}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">
            {t('confirmSyncPlaylistToPlex')}
          </p>
          
          {playlistName && (
            <div className="album-count-badge">
              <strong>{playlistName}</strong>
            </div>
          )}
          
          <div className="modal-warning">
            <FaExclamationTriangle className="warning-icon" />
            <div className="warning-content">
              <strong>{t('attention')}</strong>
              <p>This action requires that tracks are already available in your local Plex library.</p>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
            <FaLink />
            {t('syncPlaylistToPlex')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlexSyncModal;