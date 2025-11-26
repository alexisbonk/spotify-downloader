const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logToFile = require('../utils/logToFile');

const MAX_CONCURRENT_DOWNLOADS = 3;

class QueueService {
  constructor(queueFile) {
    this.queueFile = queueFile;
    this.downloadQueue = [];
    this.loadQueue();
  }

  loadQueue() {
    if (fs.existsSync(this.queueFile)) {
      try {
        this.downloadQueue = JSON.parse(fs.readFileSync(this.queueFile));
        logToFile(`[QUEUE] 📋 Queue loaded → ${this.downloadQueue.length} items from disk`, 'magenta');
        let normalized = 0;
        for (const item of this.downloadQueue) {
          if (item.status === 'started' && !item.process) {
            item.status = 'queued';
            item.progress = 0;
            normalized++;
          }
        }
        if (normalized > 0) {
          logToFile(`[QUEUE] ♻️  Normalized ${normalized} stale started items to queued`, 'magenta');
          this.saveQueue();
        }
      } catch (e) {
        logToFile('[QUEUE] 🛑 Failed to parse queue file', 'red');
        this.downloadQueue = [];
      }
    }
  }

  saveQueue() {
    fs.writeFileSync(this.queueFile, JSON.stringify(this.downloadQueue, null, 2));
  }

  getQueue() {
    return this.downloadQueue;
  }

  getRunningCount() {
    return this.downloadQueue.filter((item) => item.status === 'started' && item.process).length;
  }

  processQueue() {
    while (this.getRunningCount() < MAX_CONCURRENT_DOWNLOADS) {
      const next = this.downloadQueue.find((item) => item.status === 'queued');
      if (!next) break;
      this.startQueueItem(next);
    }
  }

  addLogToQueue(queueItem, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    queueItem.logs.push({ timestamp, message, type });
    if (queueItem.logs.length > 50) {
      queueItem.logs = queueItem.logs.slice(-50);
    }
  }

  startQueueItem(queueItem) {
    if (queueItem.type === 'plex_sync') {
      this.startPlexSyncItem(queueItem);
    } else {
      this.startDownloadItem(queueItem);
    }
  }

  startPlexSyncItem(queueItem) {
    queueItem.status = 'started';
    queueItem.progress = 0;
    queueItem.syncedTracks = 0;
    queueItem.failedTracks = [];

    this.addLogToQueue(queueItem, `Starting Plex sync of ${queueItem.name}`, 'info');
    logToFile(`[PLEX_SYNC] ▶️  Starting sync → ${queueItem.name}`, 'blue');

    this.processPlexSync(queueItem)
      .then(() => {
        queueItem.status = 'completed';
        queueItem.progress = 100;
        this.addLogToQueue(queueItem, 'Plex sync completed successfully!', 'success');
        logToFile(`[PLEX_SYNC] ✅ Completed → ${queueItem.name}`, 'green');
      })
      .catch((error) => {
        queueItem.status = 'failed';
        this.addLogToQueue(queueItem, `Plex sync failed: ${error.message}`, 'error');
        logToFile(`[PLEX_SYNC] 🛑 Failed → ${queueItem.name}: ${error.message}`, 'red');
      })
      .finally(() => {
        this.saveQueue();
        this.processQueue();
      });
  }

  async processPlexSync(queueItem) {
    const syncPlexPlaylist = require('./syncPlexPlaylist');
    
    try {
      const result = await syncPlexPlaylist({
        spotifyTracks: queueItem.spotifyTracks,
        playlistTitle: queueItem.name,
        plexConfig: {
          baseUrl: queueItem.plexConfig.url,
          token: queueItem.plexConfig.token,
          serverId: queueItem.plexConfig.serverId
        }
      });

      queueItem.syncedTracks = result.totalFound || 0;
      queueItem.progress = queueItem.totalTracks > 0 
        ? Math.round((queueItem.syncedTracks / queueItem.totalTracks) * 100)
        : 100;

      queueItem.failedTracks = result.notFound.map(track => ({
        name: `${track.title} - ${track.artist}`,
        reason: track.reason
      }));

      this.addLogToQueue(queueItem, `${queueItem.syncedTracks}/${queueItem.totalTracks} tracks synced to Plex`, 'info');
      
      if (result.foundTracks.length > 0) {
        this.addLogToQueue(queueItem, `Successfully synced: ${result.foundTracks.map(t => `${t.title} - ${t.artist}`).join(', ')}`, 'success');
      }
    } catch (error) {
      throw error;
    }
  }

  startDownloadItem(queueItem) {
    const settings = require('./settingsService').getSettings();
    queueItem.status = 'started';
    queueItem.progress = 0;
    queueItem.totalTracks = 0;
    queueItem.downloadedTracks = 0;
    queueItem.failedTracks = [];

    this.addLogToQueue(queueItem, `Starting download of ${queueItem.name}`, 'info');
    logToFile(`[DOWNLOAD] ▶️  Starting download → ${queueItem.name}`, 'blue');

    let outputPath = path.join(settings.downloadPath, '{artist}', '{album}', '{title}');
    
    const parentDir = path.dirname(outputPath.replace(/\{.*?\}/g, 'temp'));
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    queueItem.outputPath = outputPath;

    const args = [
      queueItem.url,
      '--output', outputPath,
      '--format', 'mp3',
      '--bitrate', '320k',
      '--threads', '4',
      '--no-cache',
      '--print-errors',
      '--dont-filter-results'
    ];
    
    if (settings.spotifyClientId && settings.spotifyClientSecret) {
      args.push('--client-id', settings.spotifyClientId);
      args.push('--client-secret', settings.spotifyClientSecret);
    }
    
    const spotdl = spawn('spotdl', args, {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: '0'
      }
    });
    queueItem.process = spotdl;

    let lastProgress = -1;
    let currentTrack = '';
    let tracksFound = false;

    spotdl.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.includes('Found') && line.includes('songs')) {
          const match = line.match(/Found (\d+) songs/);
          if (match) {
            queueItem.totalTracks = parseInt(match[1]);
            tracksFound = true;
            this.addLogToQueue(queueItem, `${queueItem.totalTracks} tracks found`, 'info');
            logToFile(`[DOWNLOAD] 🎵 Found ${queueItem.totalTracks} tracks`, 'cyan');
          }
        }

        if (line.includes('Processing') || line.includes('Downloading') || line.includes('Skipping')) {
          let trackMatch = line.match(/(?:Processing|Downloading)\s+(.+?)(?:\s+\d+%)?$/);
          
          if (!trackMatch && line.includes('Skipping')) {
            trackMatch = line.match(/Skipping\s+(.+?)\s+\(/);
          }
          
          if (trackMatch) {
            currentTrack = trackMatch[1].trim();
          }
        }

        const progressMatch = line.match(/(\d+)%/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          if (progress !== lastProgress) {
            lastProgress = progress;
            queueItem.progress = progress;

            if (currentTrack) {
              this.addLogToQueue(queueItem, `${currentTrack} - ${progress}%`, 'progress');
            }
          }
        }

        if (line.includes('Downloaded') || line.includes('Skipped') || line.includes('Skipping')) {
          queueItem.downloadedTracks++;
          let trackMatch = line.match(/(?:Downloaded|Skipped)\s+"(.+?)"/);
          
          if (!trackMatch && line.includes('Skipping')) {
            trackMatch = line.match(/Skipping\s+(.+?)\s+\(/);
          }
          
          if (trackMatch) {
            const trackName = trackMatch[1].trim();
            if (line.includes('file already exists') || line.includes('duplicate')) {
              this.addLogToQueue(queueItem, `⏭️ ${trackName} (already exists)`, 'success');
            } else {
              this.addLogToQueue(queueItem, `✓ ${trackName}`, 'success');
            }
          }
        }

        if (line.includes('Error') || line.includes('Failed') || line.includes('KeyError')) {
          let errorMsg = '';
          let trackName = currentTrack || 'Unknown track';
          
          if (line.includes('KeyError')) {
            const keyErrorMatch = line.match(/KeyError:\s*'([^']+)'/);
            if (keyErrorMatch) {
              errorMsg = `Metadata error: missing key '${keyErrorMatch[1]}'`;
            } else {
              errorMsg = 'Metadata error: missing information';
            }
          } else {
            const errorMatch = line.match(/(?:Error|Failed).*?:\s*(.+)/);
            if (errorMatch) {
              errorMsg = errorMatch[1];
            } else {
              errorMsg = line.trim();
            }
          }
          const urlMatch = line.match(/(https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+)/);
          if (urlMatch) {
            trackName = `${trackName} (${urlMatch[1]})`;
          }
          
          queueItem.failedTracks.push({
            name: trackName,
            reason: errorMsg,
            url: urlMatch ? urlMatch[1] : null
          });
          
          this.addLogToQueue(queueItem, `✗ ${trackName}: ${errorMsg}`, 'error');
          logToFile(`[DOWNLOAD] ❌ Erreur pour ${trackName}: ${errorMsg}`, 'red');
        }

        if (!line.includes('[2K') && !line.includes('[0m') && line.trim()) {
          this.addLogToQueue(queueItem, line, 'info');
        }
      }

      this.saveQueue();
    });

    spotdl.stderr.on('data', (data) => {
      const error = data.toString();
      logToFile(`[DOWNLOAD] ⚠️  stderr: ${error}`, 'yellow');

      if (error.includes('ERROR') || error.includes('KeyError')) {
        let errorMsg = '';
        let trackName = currentTrack || 'Unknown track';
        
        if (error.includes('KeyError')) {
          const keyErrorMatch = error.match(/KeyError:\s*'([^']+)'/);
          if (keyErrorMatch) {
            errorMsg = `Metadata error: missing key '${keyErrorMatch[1]}'`;
          } else {
            errorMsg = 'Metadata error: missing information';
          }
        } else {
          const errorMatch = error.match(/ERROR.*?:\s*(.+)/);
          if (errorMatch) {
            errorMsg = errorMatch[1];
          } else {
            errorMsg = error.trim();
          }
        }
        const urlMatch = error.match(/(https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+)/);
        if (urlMatch) {
          trackName = `${trackName} (${urlMatch[1]})`;
        }

        this.addLogToQueue(queueItem, `✗ ${trackName}: ${errorMsg}`, 'error');
        
        queueItem.failedTracks.push({
          name: trackName,
          reason: errorMsg,
          url: urlMatch ? urlMatch[1] : null
        });
      }

      this.saveQueue();
    });

    spotdl.on('close', (code) => {
      delete queueItem.process;

      if (code === 0) {
        queueItem.status = 'completed';
        queueItem.progress = 100;

        const actualFailedCount = queueItem.failedTracks ? queueItem.failedTracks.length : 0;
        const skippedCount = queueItem.downloadedTracks - (queueItem.totalTracks - actualFailedCount);
        
        if (actualFailedCount > 0) {
          this.addLogToQueue(
            queueItem,
            `Download partially completed: ${queueItem.downloadedTracks - actualFailedCount}/${queueItem.totalTracks} tracks downloaded, ${actualFailedCount} failed`,
            'warning'
          );
          logToFile(`[DOWNLOAD] ⚠️  Partially completed → ${queueItem.name}: ${queueItem.downloadedTracks - actualFailedCount}/${queueItem.totalTracks} tracks (${actualFailedCount} failed)`, 'yellow');
          this.addLogToQueue(queueItem, `Failed tracks: ${queueItem.failedTracks.map(t => t.name).join(', ')}`, 'error');
        } else if (queueItem.downloadedTracks >= queueItem.totalTracks) {
          const recentSkippedLogs = queueItem.logs.filter(log => 
            log.message.includes('already exists') || log.message.includes('⏭️')
          );
          
          if (recentSkippedLogs.length === queueItem.totalTracks) {
            this.addLogToQueue(queueItem, 'All tracks already exist - download complete!', 'success');
            logToFile(`[DOWNLOAD] ✅ All files already exist → ${queueItem.name}`, 'green');
          } else {
            this.addLogToQueue(queueItem, 'Download completed successfully!', 'success');
            logToFile(`[DOWNLOAD] ✅ Completed → ${queueItem.name}`, 'green');
          }
        } else {
          const failedCount = queueItem.totalTracks - queueItem.downloadedTracks;
          this.addLogToQueue(
            queueItem,
            `Download partially completed: ${queueItem.downloadedTracks}/${queueItem.totalTracks} tracks downloaded, ${failedCount} failed`,
            'warning'
          );
          logToFile(`[DOWNLOAD] ⚠️  Partially completed → ${queueItem.name}: ${queueItem.downloadedTracks}/${queueItem.totalTracks} tracks (${failedCount} failed)`, 'yellow');
        }
      } else if (queueItem.status !== 'canceled') {
        queueItem.status = 'failed';
        this.addLogToQueue(queueItem, `Download failed (code: ${code})`, 'error');
        logToFile(`[DOWNLOAD] 🛑 Failed → ${queueItem.name} (exit code: ${code})`, 'red');
      }

      this.saveQueue();
      this.processQueue();
    });

    spotdl.on('error', (err) => {
      logToFile(`[DOWNLOAD] 🛑 Process error → ${err.message}`, 'red');
      queueItem.status = 'failed';
      this.addLogToQueue(queueItem, `Process error: ${err.message}`, 'error');
      delete queueItem.process;
      this.saveQueue();
      this.processQueue();
    });
  }
}

module.exports = QueueService;
