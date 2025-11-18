import React from "react";
import { FaDownload, FaTrash } from "react-icons/fa";
import "../styles/QueuePanel.css";

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

const QueuePanel = ({
  isOpen,
  onClose,
  queue,
  fetchQueue,
  handleCancelDownload,
  handleResetQueue,
  isLoading
}) => {
  return (
    <div className={`queue-panel${isOpen ? " open" : ""}`}>
      <button className="queue-panel-close" onClick={onClose}>
        ×
      </button>
      <h3>Queue</h3>
      <ul className="queue-panel-list">
        {queue && queue.length > 0 ? (
          queue.map((item) => (
            <li key={item.id} className={item.status === 'failed' ? 'queue-item-failed' : item.status === 'canceled' ? 'queue-item-canceled' : 'queue-item-hover'}>
              <span className="queue-title">
                <span className="queue-title-primary">{item.name}</span>
                {typeof item.totalTracks === 'number' && item.totalTracks > 0 && (
                  <span className="queue-title-hover">{(item.downloadedTracks || 0)}/{item.totalTracks}</span>
                )}
              </span>
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
                  return (
                    <div className={`queue-progress-bar-wrapper${done ? ' queue-progress-complete' : ''}`}>
                      <div className="queue-progress-bar">
                        <div className="queue-progress-bar-fill" style={{width: `${percent}%`}}></div>
                      </div>
                      <span className={`queue-progress-bar-label${done ? ' complete' : ''}`}>
                        {done ? '👌' : `${percent}%`}
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
                  Cancel
                </button>
              )}
            </li>
          ))
        ) : (
          <li className="queue-empty">No downloads</li>
        )}
      </ul>
      <div className="queue-panel-actions">
        <button
          className="queue-refresh"
          onClick={fetchQueue}
          disabled={isLoading}
        >
          <FaDownload /> Refresh
        </button>
        <button
          className="queue-reset"
          onClick={handleResetQueue}
          disabled={isLoading}
        >
          <FaTrash /> Reset queue
        </button>
      </div>
    </div>
  );
};

export default QueuePanel;
