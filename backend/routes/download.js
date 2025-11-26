const express = require('express');
const router = express.Router();
const logToFile = require('../utils/logToFile');

router.get('/queue', (req, res) => {
  const downloadQueue = req.app.locals.downloadQueue;
  logToFile(`[QUEUE] 📋 Queue requested → ${downloadQueue.length} items`);
  res.status(200).send(downloadQueue);
});

router.post('/download', async (req, res) => {
  const settings = req.app.locals.settings;
  const downloadQueue = req.app.locals.downloadQueue;
  const saveQueue = req.app.locals.saveQueue;
  const processQueue = req.app.locals.processQueue;
  
  const { url, type, name, image } = req.body;
  const downloadPath = settings.downloadPath;
  
  if (!url || !downloadPath) {
    return res.status(400).send('Missing URL or download path not configured');
  }
  
  const queueItem = {
    id: Date.now().toString(),
    url,
    type,
    name: name || 'Unknown',
    image: image || null,
    status: 'queued',
    progress: 0,
    createdAt: new Date().toISOString(),
    logs: [],
    totalTracks: 0,
    downloadedTracks: 0,
    failedTracks: []
  };
  
  downloadQueue.push(queueItem);
  saveQueue();
  processQueue();
  
  logToFile(`[DOWNLOAD] 📥 Added to queue → ${name} (${type})`, 'blue');
  res.status(200).send({ message: 'Download queued', id: queueItem.id });
});

router.post('/cancel-download', (req, res) => {
  const downloadQueue = req.app.locals.downloadQueue;
  const saveQueue = req.app.locals.saveQueue;
  
  const { id } = req.body;
  const queueItem = downloadQueue.find(item => item.id === id);

  if (!queueItem) {
    return res.status(404).send({ message: 'Download not found' });
  }

  if (queueItem.status === 'started' && queueItem.process) {
    try {
      queueItem.process.kill('SIGTERM');
      setTimeout(() => {
        if (queueItem.process && !queueItem.process.killed) {
          queueItem.process.kill('SIGKILL');
        }
      }, 5000);
      
      queueItem.status = 'canceled';
      queueItem.progress = 0;
      delete queueItem.process;
      
      saveQueue();
      logToFile(`[CANCEL] ❌ Download canceled → ${queueItem.name}`, 'yellow');
      res.status(200).send({ message: 'Download canceled', queue: downloadQueue });
    } catch (err) {
      logToFile(`[CANCEL] 🛑 Failed to cancel download: ${err.message}`, 'red');
      res.status(500).send({ message: 'Failed to cancel download' });
    }
  } else if (queueItem.status === 'queued') {
    queueItem.status = 'canceled';
    saveQueue();
    logToFile(`[CANCEL] ❌ Queued download canceled → ${queueItem.name}`, 'yellow');
    res.status(200).send({ message: 'Queued download canceled', queue: downloadQueue });
  } else {
    res.status(400).send({ message: 'Cannot cancel this download' });
  }
});

router.post('/reset-queue', (req, res) => {
  const downloadQueue = req.app.locals.downloadQueue;
  const saveQueue = req.app.locals.saveQueue;
  
  downloadQueue.length = 0;
  saveQueue();
  logToFile('[QUEUE] 🧹 Download queue reset');
  res.status(200).send({ message: 'Queue reset', queue: downloadQueue });
});

module.exports = router;
