import React, { useState } from "react";
import { FaDownload, FaTrash, FaInfoCircle } from "react-icons/fa";
import QueueDetailsModal from "./QueueDetailsModal";
import "../styles/QueuePanel.css";
import { useLanguage } from '../contexts/LanguageContext';

const toPercent = (item) => {
  if (typeof item.totalTracks === 'number' && item.totalTracks > 0) {
    const processed = item.type === 'plex_sync' 
      ? Math.max(0, Math.min(item.totalTracks, item.syncedTracks || 0))
      : Math.max(0, Math.min(item.totalTracks, item.downloadedTracks || 0));
    return Math.min(100, Math.round((processed / item.totalTracks) * 100));
  }
  if (typeof item.progress === 'number') {
    return Math.max(0, Math.min(100, Math.round(item.progress)));
  }
  return 0;
};

const isFullyComplete = (item, percent) => {
  if (item.status !== 'completed') return false;
  if (typeof item.totalTracks === 'number' && item.totalTracks > 0) {
    const processed = item.type === 'plex_sync' 
      ? (item.syncedTracks || 0)
      : (item.downloadedTracks || 0);
    return processed >= item.totalTracks;
  }
  return percent === 100;
};

const isPartiallyComplete = (item) => {
  if (item.status !== 'completed') return false;
  if (typeof item.totalTracks === 'number' && item.totalTracks > 0) {
    const processed = item.type === 'plex_sync' 
      ? (item.syncedTracks || 0)
      : (item.downloadedTracks || 0);
    return processed < item.totalTracks;
  }
  return false;
};

const QueuePanel = ({
  isOpen,
  onClose,
  queue,
  fetchQueue,
  handleCancelDownload,
  handleResetQueue,
  isLoading,
  isBackendOnline = true,
  connectionError = null
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
      
      {/* Connection Status Indicator */}
      {!isBackendOnline && (
        <div className="connection-status offline">
          <div className="connection-status-indicator"></div>
          <span className="connection-status-text">
            {connectionError || 'Backend server is offline'}
          </span>
        </div>
      )}
      
      <ul className="queue-panel-list">
        {queue && queue.length > 0 ? (
          queue.map((item) => (
            <li key={item.id} className={item.status === 'failed' ? 'queue-item-failed' : item.status === 'canceled' ? 'queue-item-canceled' : 'queue-item-clickable'}>
              <div className="queue-item-content" onClick={() => handleItemClick(item)}>
                <span className="queue-title">
                  <span className="queue-title-primary">{item.name}</span>
                  {typeof item.totalTracks === 'number' && item.totalTracks > 0 && (
                    <span className="queue-title-secondary">
                      ({item.type === 'plex_sync' ? (item.syncedTracks || 0) : (item.downloadedTracks || 0)}/{item.totalTracks})
                    </span>
                  )}
                </span>
                <FaInfoCircle className="queue-info-icon" />
              </div>
                {(() => {
                  const percent = toPercent(item);
                  const showProgress = item.status === 'started' || item.status === 'completed' || item.status === 'failed' || item.status === 'canceled';
                  if (!showProgress) return null;
                  
                  const done = isFullyComplete(item, percent);
                  const partial = isPartiallyComplete(item);
                  const failed = item.status === 'failed';
                  const canceled = item.status === 'canceled';
                  
                  let emoji = '⏳';
                  let statusClass = '';
                  
                  if (failed) {
                    emoji = '❌';
                    statusClass = ' queue-progress-failed';
                  } else if (canceled) {
                    emoji = '🚫';
                    statusClass = ' queue-progress-canceled';
                  } else if (done) {
                    emoji = '✅';
                    statusClass = ' queue-progress-complete';
                  } else if (partial) {
                    emoji = '⚠️';
                    statusClass = ' queue-progress-partial';
                  }
                  
                  return (
                    <div className={`queue-progress-bar-wrapper${statusClass}`}>
                      <div className="queue-progress-bar">
                        <div className={`queue-progress-bar-fill${partial ? ' partial' : ''}${failed ? ' failed' : ''}${canceled ? ' canceled' : ''}`} style={{width: failed || canceled ? '100%' : `${percent}%`}}></div>
                      </div>
                      <span className={`queue-progress-bar-label${done ? ' complete' : ''}${partial ? ' partial' : ''}${failed ? ' failed' : ''}${canceled ? ' canceled' : ''}`}>
                        {emoji}
                      </span>
                    </div>
                  );
                })()}
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
        onCancelDownload={handleCancelDownload}
      />
    </div>
  );
};

export default QueuePanel;
