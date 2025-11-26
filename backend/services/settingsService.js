const fs = require('fs');
const logToFile = require('../utils/logToFile');

class SettingsService {
  constructor(settingsFile) {
    this.settingsFile = settingsFile;
    this.settings = {
      downloadPath: process.env.DOWNLOAD_PATH || '',
      autoRefreshQueue: false,
      refreshInterval: 5000,
      plexUrl: '',
      spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
      spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      spotifyRedirectUri: 'http://127.0.0.1:3005/callback',
      plexToken: process.env.REACT_APP_PLEX_TOKEN || process.env.PLEX_TOKEN || '',
      plexServerId: process.env.PLEX_SERVER_ID || ''
    };
    this.loadSettings();
  }

  loadSettings() {
    if (fs.existsSync(this.settingsFile)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(this.settingsFile));
        this.settings = { ...this.settings, ...fileContent };
        logToFile(`[SETTINGS] ⚙️  Settings loaded → Download path: ${this.settings.downloadPath}`, 'gray');
      } catch (e) {
        logToFile('[SETTINGS] 🛑 Failed to parse settings file', 'red');
      }
    }
  }

  saveSettings() {
    fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }
}

let instance;

module.exports = {
  initialize: (settingsFile) => {
    instance = new SettingsService(settingsFile);
    return instance;
  },
  getSettings: () => {
    if (!instance) {
      throw new Error('SettingsService not initialized');
    }
    return instance.getSettings();
  },
  saveSettings: () => {
    if (!instance) {
      throw new Error('SettingsService not initialized');
    }
    return instance.saveSettings();
  },
  updateSettings: (updates) => {
    if (!instance) {
      throw new Error('SettingsService not initialized');
    }
    return instance.updateSettings(updates);
  }
};
