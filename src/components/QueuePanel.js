import React from "react";
import { FaDownload, FaTrash } from "react-icons/fa";
import "../styles/QueuePanel.css";

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
      <ul className="queue-panel-list">
        {queue && queue.length > 0 ? (
          queue.map((item) => (
            <li key={item.id} className={item.status === 'failed' ? 'queue-item-failed' : 'queue-item-hover'}>
              <span className="queue-title">{item.name}</span>
                {item.status === 'failed' && (
                  <div className="queue-progress-bar-wrapper queue-status-failed">
                    <span role="img" aria-label="failed" style={{color: '#e74c3c', fontWeight: 'bold', fontSize: '1.1em'}}>Failed</span>
                  </div>
                )}
                {item.status !== 'complete' && item.status !== 'failed' && item.progress !== undefined && (
                  <div className="queue-progress-bar-wrapper">
                        <div className="queue-progress-bar">
                          <div className="queue-progress-bar-fill" style={{width: `${item.progress}%`}}></div>
                        </div>
                        {item.status === 'completed' ? (
                          <span>👌</span>
                        ) : (
                          <span className="queue-progress-bar-label">{item.progress}%</span>
                      )}
                  </div>
                )}
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
    </div>
  );
};

export default QueuePanel;
