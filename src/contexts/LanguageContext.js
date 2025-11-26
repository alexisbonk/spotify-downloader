import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    settings: 'Settings',
    downloadPath: 'Download Path',
    plexUrl: 'Plex URL',
    autoRefreshQueue: 'Auto-refresh queue',
    advancedSettings: 'Advanced Settings',
    spotifyClientId: 'Spotify Client ID',
    spotifyClientSecret: 'Spotify Client Secret',
    spotifyRedirectUri: 'Spotify Redirect URI',
    plexToken: 'Plex Token',
    plexServerId: 'Plex Server ID',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving...',
    settingsSaved: 'Settings saved',
    invalidPath: 'Invalid path',
    invalidPlexUrl: 'Invalid Plex URL',
    pathValidationError: 'Error validating path',
    plexValidationError: 'Error validating Plex URL',
    settingsSaveError: 'Error saving settings',
    queue: 'Queue',
    noDownloads: 'No downloads',
    refresh: 'Refresh',
    resetQueue: 'Reset queue',
    cancel: 'Cancel',
    failed: 'Failed',
    canceled: 'Canceled',
    completed: 'Completed',
    inProgress: 'In Progress',
    queued: 'Queued',
    unknown: 'Unknown',
    incomplete: 'Incomplete',
    type: 'Type',
    notSpecified: 'Not specified',
    downloadSummary: 'Download Summary',
    tracksDownloaded: 'tracks downloaded',
    failures: 'failure(s)',
    spotifyUrl: 'Spotify URL',
    openInSpotify: 'Open in Spotify',
    destinationFolder: 'Destination Folder',
    failedTracks: 'Failed Tracks',
    recentLogs: 'Recent Logs',
    unknownReason: 'Unknown reason',
    language: 'Language',
    downloadAllAlbums: 'Download all albums',
    confirmDownloadAllAlbums: 'Are you sure you want to download all albums from this artist?',
    albums: 'albums',
    willBeDownloaded: 'will be downloaded',
    attention: 'Attention:',
    downloadTimeWarning: 'Downloading all albums may take a long time and consume bandwidth. We recommend downloading albums one by one for better experience and control.',
    download: 'Download'
  },
  fr: {
    settings: 'Paramètres',
    downloadPath: 'Chemin de téléchargement',
    plexUrl: 'Plex URL',
    autoRefreshQueue: 'Rafraîchir automatiquement la file d\'attente',
    advancedSettings: 'Paramètres avancés',
    spotifyClientId: 'Spotify Client ID',
    spotifyClientSecret: 'Spotify Client Secret',
    spotifyRedirectUri: 'Spotify Redirect URI',
    plexToken: 'Plex Token',
    plexServerId: 'Plex Server ID',
    save: 'Enregistrer',
    cancel: 'Annuler',
    saving: 'Enregistrement...',
    settingsSaved: 'Paramètres enregistrés',
    invalidPath: 'Chemin invalide',
    invalidPlexUrl: 'URL Plex invalide',
    pathValidationError: 'Erreur lors de la validation du chemin',
    plexValidationError: 'Erreur lors de la validation de l\'URL Plex',
    settingsSaveError: 'Erreur lors de l\'enregistrement des paramètres',
    queue: 'Queue',
    noDownloads: 'Aucun téléchargement',
    refresh: 'Actualiser',
    resetQueue: 'Réinitialiser la queue',
    cancel: 'Annuler',
    failed: 'Échec',
    canceled: 'Annulé',
    completed: 'Terminé',
    inProgress: 'En cours',
    queued: 'En attente',
    unknown: 'Inconnu',
    incomplete: 'Incomplet',
    type: 'Type',
    notSpecified: 'Non spécifié',
    downloadSummary: 'Résumé du téléchargement',
    tracksDownloaded: 'titres téléchargés',
    failures: 'échec(s)',
    spotifyUrl: 'URL Spotify',
    openInSpotify: 'Ouvrir dans Spotify',
    destinationFolder: 'Dossier de destination',
    failedTracks: 'Titres échoués',
    recentLogs: 'Logs récents',
    unknownReason: 'Raison inconnue',
    language: 'Langue',
    downloadAllAlbums: 'Télécharger tous les albums',
    confirmDownloadAllAlbums: 'Êtes-vous sûr de vouloir télécharger tous les albums de cet artiste ?',
    albums: 'albums',
    willBeDownloaded: 'seront téléchargés',
    attention: 'Attention :',
    downloadTimeWarning: 'Le téléchargement de tous les albums peut prendre beaucoup de temps et consommer de la bande passante. Nous recommandons de télécharger les albums un par un pour une meilleure expérience et un meilleur contrôle.',
    download: 'Télécharger'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('spotify-downloader-language');
    return saved || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('spotify-downloader-language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
