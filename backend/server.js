const express = require('express');
const cors = require('cors');
const path = require('path');
const logToFile = require('./utils/logToFile');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const { initialize: initSettingsService, getSettings, saveSettings } = require('./services/settingsService');
const QueueService = require('./services/queueService');

const settingsFile = path.join(__dirname, 'data', 'settings.json');
const queueFile = path.join(__dirname, 'data', 'queue.json');

initSettingsService(settingsFile);
const queueService = new QueueService(queueFile);

app.locals.settings = getSettings();
app.locals.saveSettings = saveSettings;
app.locals.downloadQueue = queueService.getQueue();
app.locals.saveQueue = () => queueService.saveQueue();
app.locals.processQueue = () => queueService.processQueue();
app.locals.startQueueItem = (item) => queueService.startQueueItem(item);

const spotifyRoutes = require('./routes/spotify');
const settingsRoutes = require('./routes/settings');
const downloadRoutes = require('./routes/download');
const plexRoutes = require('./routes/plex');
const validateRoutes = require('./routes/validate');

app.use('/settings', settingsRoutes);
app.use('/', spotifyRoutes);
app.use('/', downloadRoutes);
app.use('/', plexRoutes);
app.use('/', validateRoutes);

const os = require('os');
const PORT = process.env.PORT || 8585;
const HOST = '0.0.0.0';

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

app.listen(PORT, HOST, () => {
  logToFile(`Server running on http://${HOST}:${PORT} 🚀`, 'green');
  console.log(`Server is accessible on your local network at: http://${localIP}:${PORT}`);
});

module.exports = app;
