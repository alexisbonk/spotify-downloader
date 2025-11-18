import React from 'react';
import { FaDownload, FaTimes } from 'react-icons/fa';
import '../styles/AlbumPreviewModal.css';

const AlbumPreviewModal = ({ item, tracks, isLoading, onClose, onDownload }) => {
  if (!item) return null;

  const type = item.__previewType || 'album';
  const primaryArtist = type === 'playlist'
    ? item.owner?.display_name
    : item.artists?.map((a) => a.name).join(', ');

  const cover = item.images?.[0]?.url;
  const title = item.name;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="album-preview-backdrop" role="dialog" aria-modal="true" onMouseDown={handleBackdropClick}>
      <div className="album-preview-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="album-preview-close" onClick={onClose} aria-label="Close preview">
          <FaTimes />
        </button>
        <div className="album-preview-header">
          {cover && (
            <img src={cover} alt={title} className="album-preview-art" />
          )}
          <div>
            <h2>{title}</h2>
            {primaryArtist && (
              <p className="album-preview-artist">
                {type === 'playlist' ? `Par ${primaryArtist}` : primaryArtist}
              </p>
            )}
            {item.release_date && type === 'album' && (
              <p className="album-preview-meta">Sortie: {item.release_date}</p>
            )}
            <button className="spotify-btn-main" onClick={onDownload}>
              <FaDownload style={{ marginRight: 6 }} />
              {type === 'playlist' ? 'Télécharger la playlist' : "Télécharger l'album"}
            </button>
          </div>
        </div>
        <div className="album-preview-body">
          {isLoading ? (
            <div className="loader-centered">
              <div className="loader" />
            </div>
          ) : tracks && tracks.length > 0 ? (
            <ol>
              {tracks.map((track, index) => (
                <li key={track.id || `${item.id}-${index}`}>
                  <span className="track-index">{index + 1}.</span>
                  <div>
                    <p className="track-title">{track.name}</p>
                    {track.artists && (
                      <p className="track-artist">
                        {track.artists.map((artist) => artist.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="track-duration">{track.duration_ms ? formatDuration(track.duration_ms) : ''}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="album-preview-empty">Aucun titre trouvé pour cet album.</p>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default AlbumPreviewModal;
