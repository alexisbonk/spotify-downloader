import React from 'react';
import { FaSave, FaTimes, FaSearch, FaCheckCircle, FaTimesCircle, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../styles/SettingsModal.css';
import { validatePath as apiValidatePath, validatePlexUrl as apiValidatePlexUrl } from '../api/spotifyApi';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsModal = ({ downloadPath, setDownloadPath, plexUrl, setPlexUrl, autoRefreshQueue, setAutoRefreshQueue, refreshInterval, setRefreshInterval, spotifyClientId, setSpotifyClientId, spotifyClientSecret, setSpotifyClientSecret, spotifyRedirectUri, setSpotifyRedirectUri, plexToken, setPlexToken, plexServerId, setPlexServerId, handlePathChange, onClose }) => {
  const { t, setLanguage, language } = useLanguage();
  const [validateMsg, setValidateMsg] = React.useState(null);
  const [validateState, setValidateState] = React.useState('idle');
  const [validatePlexMsg, setValidatePlexMsg] = React.useState(null);
  const [validatePlexState, setValidatePlexState] = React.useState('idle');
  const [saveMsg, setSaveMsg] = React.useState(null);
  const [saveState, setSaveState] = React.useState('idle');
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  const onValidatePath = async () => {
    setValidateState('loading');
    setValidateMsg(null);
    try {
      const res = await apiValidatePath(downloadPath);
      const { valid, message } = res.data || {};
      if (valid) {
        setValidateState('success');
        setValidateMsg(null);
      } else {
        setValidateState('error');
        setValidateMsg(message || t('invalidPath'));
      }
    } catch (e) {
      setValidateState('error');
      const backendMessage = (e && e.response && (e.response.data && (e.response.data.message || e.response.data))) || e.message;
      setValidateMsg(backendMessage || t('pathValidationError'));
    }
  };

  const onValidatePlexUrl = async () => {
    setValidatePlexState('loading');
    setValidatePlexMsg(null);
    try {
      const res = await apiValidatePlexUrl(plexUrl);
      const { valid, message } = res.data || {};
      if (valid) {
        setValidatePlexState('success');
        setValidatePlexMsg(null);
      } else {
        setValidatePlexState('error');
        setValidatePlexMsg(message || t('invalidPlexUrl'));
      }
    } catch (e) {
      setValidatePlexState('error');
      const backendMessage = (e && e.response && (e.response.data && (e.response.data.message || e.response.data))) || e.message;
      setValidatePlexMsg(backendMessage || t('plexValidationError'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveState('loading');
    setSaveMsg(null);
    try {
      await handlePathChange();
      setSaveState('success');
      setSaveMsg(t('settingsSaved'));
    } catch (e) {
      setSaveState('error');
      if (e.response && e.response.data && e.response.data.details) {
        setSaveMsg(e.response.data.details.join(', '));
      } else if (e.response && e.response.data && e.response.data.error) {
        setSaveMsg(e.response.data.error);
      } else {
        setSaveMsg(t('settingsSaveError'));
      }
    }
  };

  return (
    <div className="spotify-settings-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={handleBackdropClick}>
      <div className="spotify-settings-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="settings-modal-close" aria-label="Fermer les paramètres" onClick={onClose}>
          <FaTimes />
        </button>
        <div className="settings-modal-header">
          <h2>{t('settings')}</h2>
        </div>
        <form className="settings-modal-body" onSubmit={handleSubmit}>
          
          <div className="auto-refresh-section">
            <div className="auto-refresh-header">
              <span className="auto-refresh-title">{t('autoRefreshQueue')}</span>
              <div className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  id="auto-refresh-toggle"
                  checked={autoRefreshQueue}
                  onChange={(e) => setAutoRefreshQueue(e.target.checked)}
                />
                <label htmlFor="auto-refresh-toggle" className="toggle-switch">
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            {autoRefreshQueue && (
              <div className="auto-refresh-options">
                <div className="refresh-frequency">
                  <span className="frequency-label">{t('refreshEvery')}:</span>
                  <select 
                    className="frequency-select"
                    value={refreshInterval || 5000}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  >
                    <option value={3000}>3s</option>
                    <option value={5000}>5s</option>
                    <option value={10000}>10s</option>
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                  </select>
                </div>
                <div className="refresh-indicator">
                  <div className="pulse-dot"></div>
                  <span>{t('autoRefreshActive')}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="language-selector">
            <span className="language-label">{t('language')}:</span>
            <select 
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
          
          <div style={{ marginTop: '20px', marginBottom: '10px' }}>
            <button
              type="button"
              className="settings-btn-ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                padding: '10px'
              }}
            >
              {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
              <span>{t('advancedSettings')}</span>
            </button>
          </div>

          {showAdvanced && (
            <>
              <label className="settings-modal-field">
                <span>{t('downloadPath')}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={downloadPath}
                    onChange={(e) => setDownloadPath(e.target.value)}
                    placeholder="/Volumes/Music/Albums"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="settings-btn-ghost"
                    onClick={onValidatePath}
                    disabled={!downloadPath || validateState === 'loading'}
                    aria-label="Vérifier le chemin"
                  >
                    {validateState === 'loading' && <FaSpinner className="spin" />}
                    {validateState === 'idle' && <FaSearch />}
                    {validateState === 'success' && <FaCheckCircle color="#28a745" />}
                    {validateState === 'error' && <FaTimesCircle color="#dc3545" />}
                  </button>
                </div>
                {validateState === 'error' && validateMsg && (
                  <div className={`settings-inline-feedback error`}>
                    {validateMsg}
                  </div>
                )}
              </label>
              <label className="settings-modal-field">
                <span>{t('plexUrl')}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={plexUrl}
                    onChange={(e) => setPlexUrl(e.target.value)}
                    placeholder="http://192.168.1.xx:32400"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="settings-btn-ghost"
                    onClick={onValidatePlexUrl}
                    disabled={!plexUrl || validatePlexState === 'loading'}
                    aria-label="Vérifier l'URL Plex"
                  >
                    {validatePlexState === 'loading' && <FaSpinner className="spin" />}
                    {validatePlexState === 'idle' && <FaSearch />}
                    {validatePlexState === 'success' && <FaCheckCircle color="#28a745" />}
                    {validatePlexState === 'error' && <FaTimesCircle color="#dc3545" />}
                  </button>
                </div>
                {validatePlexState === 'error' && validatePlexMsg && (
                  <div className={`settings-inline-feedback error`}>
                    {validatePlexMsg}
                  </div>
                )}
              </label>
              
              <label className="settings-modal-field">
                <span>{t('spotifyClientId')}</span>
                <input
                  type="text"
                  value={spotifyClientId}
                  onChange={(e) => setSpotifyClientId(e.target.value)}
                  placeholder={`${t('spotifyClientId')}`}
                />
              </label>
              <label className="settings-modal-field">
                <span>{t('spotifyClientSecret')}</span>
                <input
                  type="text"
                  value={spotifyClientSecret}
                  onChange={(e) => setSpotifyClientSecret(e.target.value)}
                  placeholder={`${t('spotifyClientSecret')}`}
                />
              </label>
              <label className="settings-modal-field">
                <span>{t('spotifyRedirectUri')}</span>
                <input
                  type="text"
                  value={spotifyRedirectUri}
                  onChange={(e) => setSpotifyRedirectUri(e.target.value)}
                  placeholder="http://127.0.0.1:3005/callback"
                />
              </label>
              <label className="settings-modal-field">
                <span>{t('plexToken')}</span>
                <input
                  type="text"
                  value={plexToken}
                  onChange={(e) => setPlexToken(e.target.value)}
                  placeholder={`${t('plexToken')}`}
                />
              </label>
              <label className="settings-modal-field">
                <span>{t('plexServerId')}</span>
                <input
                  type="text"
                  value={plexServerId}
                  onChange={(e) => setPlexServerId(e.target.value)}
                  placeholder={`${t('plexServerId')}`}
                />
              </label>
            </>
          )}
          <div className="settings-modal-actions">
            <button type="button" className="settings-btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="spotify-btn-main settings-btn-save" disabled={saveState === 'loading'}>
              <FaSave style={{ marginRight: 6 }} /> {saveState === 'loading' ? t('saving') : t('save')}
            </button>
          </div>
          {saveMsg && (
            <div className={`settings-inline-feedback ${saveState}`}>
              {saveMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
