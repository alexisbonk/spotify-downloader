const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const logToFile = require('./utils/logToFile');
require('dotenv').config();

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4420',
      `http://${getLocalIP()}:3000`,
      `http://${getLocalIP()}:4420`
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));
app.use(express.json());

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

const PORT = process.env.PORT || 4420;
const HOST = '0.0.0.0';
const localIP = getLocalIP();

app.listen(PORT, HOST, () => {
  logToFile(`Server running on http://${HOST}:${PORT} 🚀`, 'green');
  console.log(`Server is accessible on your local network at: http://${localIP}:${PORT}`);
});

module.exports = app;
