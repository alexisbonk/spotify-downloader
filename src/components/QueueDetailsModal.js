import React from "react";
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaClock, FaPlay } from "react-icons/fa";
import { cleanAnsiCodes } from "../utils/ansiCleaner";
import "../styles/QueueDetailsModal.css";
import { useLanguage } from '../contexts/LanguageContext';

const QueueDetailsModal = ({ isOpen, onClose, queueItem }) => {
  const { t } = useLanguage();
  if (!isOpen || !queueItem) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="status-icon success" />;
      case 'failed':
        return <FaExclamationCircle className="status-icon error" />;
      case 'started':
        return <FaPlay className="status-icon running" />;
      case 'queued':
        return <FaClock className="status-icon queued" />;
      case 'canceled':
        return <FaTimes className="status-icon canceled" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return t('completed');
      case 'failed':
        return t('failed');
      case 'started':
        return t('inProgress');
      case 'queued':
        return t('queued');
      case 'canceled':
        return t('canceled');
      default:
        return t('unknown');
    }
  };

  const isPartiallyComplete = queueItem.status === 'completed' && 
    queueItem.totalTracks > 0 && 
    queueItem.downloadedTracks < queueItem.totalTracks;


  return (
    <div className="queue-details-overlay" onClick={onClose}>
      <div className="queue-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="queue-details-header">
          <div className="queue-details-title-section">
            {queueItem.image && (
              <img 
                src={queueItem.image} 
                alt={queueItem.name} 
                className="queue-details-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <h3>{queueItem.name}</h3>
          </div>
          <button className="queue-details-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="queue-details-content">
          <div className="queue-details-status">
            {getStatusIcon(queueItem.status)}
            <span className="status-text">{getStatusText(queueItem.status)}</span>
            {isPartiallyComplete && (
              <span className="partial-warning">⚠️ {t('incomplete')}</span>
            )}
          </div>

          <div className="queue-details-stats">
            <div className="stat-item">
              <label>{t('type')}:</label>
              <span>{queueItem.type || t('notSpecified')}</span>
            </div>
            

            {queueItem.totalTracks > 0 && (
              <div className="stat-item">
                <label>{t('downloadSummary')}:</label>
                <span>
                  <span className={queueItem.downloadedTracks < queueItem.totalTracks ? 'partial' : 'complete'}>
                    {queueItem.downloadedTracks}/{queueItem.totalTracks} {t('tracksDownloaded')}
                  </span>
                  {queueItem.status !== 'started' && queueItem.totalTracks - queueItem.downloadedTracks > 0 && (
                    <span className="failed-count">
                      {' - '}{queueItem.totalTracks - queueItem.downloadedTracks} {t('failures')}
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="stat-item">
              <label>{t('spotifyUrl')}:</label>
              <a 
                href={queueItem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="spotify-link"
              >
                {t('openInSpotify')}
              </a>
            </div>

            {queueItem.outputPath && (
              <div className="stat-item">
                <label>{t('destinationFolder')}:</label>
                <span className="output-path" title={queueItem.outputPath}>
                  {(() => {
                    const parts = queueItem.outputPath.split('/');
                    if (parts.length <= 2) return queueItem.outputPath;
                    const lastTwo = parts.slice(-2);
                    if (lastTwo[1] === queueItem.name || lastTwo[0] === queueItem.name) {
                      return queueItem.name;
                    }
                    return lastTwo.join('/');
                  })()}
                </span>
              </div>
            )}
          </div>

          {queueItem.failedTracks && queueItem.failedTracks.length > 0 && (
            <div className="queue-details-failures">
              <h4>{t('failedTracks')}:</h4>
              <div className="failed-tracks-list">
                {queueItem.failedTracks.map((track, index) => (
                  <div key={index} className="failed-track">
                    <span className="track-name">{track.name || `Track ${index + 1}`}</span>
                    <span className="failure-reason">{track.reason || t('unknownReason')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queueItem.logs && queueItem.logs.length > 0 && (
            <div className="queue-details-logs">
              <h4>{t('recentLogs')}:</h4>
              <div className="logs-container">
                {queueItem.logs.slice(-10).map((log, index) => (
                  <div key={index} className={`log-entry ${log.type || 'info'}`}>
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className="log-message">{cleanAnsiCodes(log.message)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueDetailsModal;
