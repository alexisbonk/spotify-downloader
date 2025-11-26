import React, { useState } from "react";
import { FaDownload, FaTrash, FaInfoCircle } from "react-icons/fa";
import QueueDetailsModal from "./QueueDetailsModal";
import "../styles/QueuePanel.css";
import { useLanguage } from '../contexts/LanguageContext';

const toPercent = (item) => {
  if (typeof item.totalTracks === 'number' && item.totalTracks > 0) {
    const downloaded = Math.max(0, Math.min(item.totalTracks, item.downloadedTracks || 0));
    return Math.min(100, Math.round((downloaded / item.totalTracks) * 100));
  }
  if (typeof item.progress === 'number') {
    return Math.max(0, Math.min(100, Math.round(item.progress)));
  }
  return 0;
};

const isFullyComplete = (item, percent) => {
  if (item.status !== 'completed') return false;
  if (typeof item.totalTracks === 'number' && item.totalTracks > 0) {
    return (item.downloadedTracks || 0) >= item.totalTracks;
  }
  return percent === 100;
};

const isPartiallyComplete = (item) => {
  return item.status === 'completed' && 
         typeof item.totalTracks === 'number' && 
         item.totalTracks > 0 && 
         (item.downloadedTracks || 0) < item.totalTracks;
};

const QueuePanel = ({
  isOpen,
  onClose,
  queue,
  fetchQueue,
  handleCancelDownload,
  handleResetQueue,
  isLoading
}) => {
  const { t } = useLanguage();
  const [selectedQueueItemId, setSelectedQueueItemId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const selectedQueueItem = selectedQueueItemId 
    ? queue.find(item => item.id === selectedQueueItemId) 
    : null;

  React.useEffect(() => {
    if (selectedQueueItemId && !selectedQueueItem && isDetailsModalOpen) {
      closeDetailsModal();
    }
  }, [selectedQueueItemId, selectedQueueItem, isDetailsModalOpen]);

  const handleItemClick = (item) => {
    setSelectedQueueItemId(item.id);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedQueueItemId(null);
  };

  return (
    <div className={`queue-panel${isOpen ? " open" : ""}`}>
      <button className="queue-panel-close" onClick={onClose}>
        ×
      </button>
      <h3>{t('queue')}</h3>
      <ul className="queue-panel-list">
        {queue && queue.length > 0 ? (
          queue.map((item) => (
            <li key={item.id} className={item.status === 'failed' ? 'queue-item-failed' : item.status === 'canceled' ? 'queue-item-canceled' : 'queue-item-clickable'}>
              <div className="queue-item-content" onClick={() => handleItemClick(item)}>
                <span className="queue-title">
                  <span className="queue-title-primary">{item.name}</span>
                  {typeof item.totalTracks === 'number' && item.totalTracks > 0 && (
                    <span className="queue-title-secondary">({(item.downloadedTracks || 0)}/{item.totalTracks})</span>
                  )}
                </span>
                <FaInfoCircle className="queue-info-icon" />
              </div>
                {item.status === 'failed' && (
                  <div className="queue-progress-bar-wrapper queue-status-failed">
                    <span role="img" aria-label="failed" style={{color: '#e74c3c', fontWeight: 'bold', fontSize: '1.1em'}}>
                      ❌ Failed
                    </span>
                  </div>
                )}
                {item.status === 'canceled' && (
                  <div className="queue-progress-bar-wrapper queue-status-canceled">
                    <span role="img" aria-label="canceled" style={{color: '#f1c40f', fontWeight: 'bold', fontSize: '1.1em'}}>
                      🚫 Canceled
                    </span>
                  </div>
                )}
                {(() => {
                  const percent = toPercent(item);
                  const showProgress = item.status === 'started' || item.status === 'completed';
                  if (!showProgress) return null;
                  const done = isFullyComplete(item, percent);
                  const partial = isPartiallyComplete(item);
                  return (
                    <div className={`queue-progress-bar-wrapper${done ? ' queue-progress-complete' : ''}${partial ? ' queue-progress-partial' : ''}`}>
                      <div className="queue-progress-bar">
                        <div className={`queue-progress-bar-fill${partial ? ' partial' : ''}`} style={{width: `${percent}%`}}></div>
                      </div>
                      <span className={`queue-progress-bar-label${done ? ' complete' : ''}${partial ? ' partial' : ''}`}>
                        {done ? '✅' : partial ? '⚠️' : '⏳'}
                      </span>
                    </div>
                  );
                })()}
              {item.status === "started" && (
                <button
                  className="queue-cancel queue-cancel-hover"
                  onClick={() => handleCancelDownload(item.id)}
                  disabled={isLoading}
                >
                  {t('cancel')}
                </button>
              )}
            </li>
          ))
        ) : (
          <li className="queue-empty">{t('noDownloads')}</li>
        )}
      </ul>
      <div className="queue-panel-actions">
        <button
          className="queue-refresh"
          onClick={fetchQueue}
          disabled={isLoading}
        >
          <FaDownload /> {t('refresh')}
        </button>
        <button
          className="queue-reset"
          onClick={handleResetQueue}
          disabled={isLoading}
        >
          <FaTrash /> {t('resetQueue')}
        </button>
      </div>
      
      <QueueDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        queueItem={selectedQueueItem}
      />
    </div>
  );
};

export default QueuePanel;
