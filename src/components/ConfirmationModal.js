import React from 'react';
import { FaDownload, FaTimes, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import '../styles/ConfirmationModal.css';
import { useLanguage } from '../contexts/LanguageContext';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  albumCount,
  showWarning = false
}) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <FaDownload className="modal-icon" />
            {t('downloadAllAlbums')}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">{t('confirmDownloadAllAlbums')}</p>
          
          {albumCount && (
            <div className="album-count-badge">
              <strong>{albumCount} {t('albums')}</strong> {t('willBeDownloaded')}
            </div>
          )}
          
          {showWarning && (
            <div className="modal-warning">
              <FaExclamationTriangle className="warning-icon" />
              <div className="warning-content">
                <strong>{t('attention')}</strong>
                <p>{t('downloadTimeWarning')}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
            <FaDownload />
            {t('download')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
