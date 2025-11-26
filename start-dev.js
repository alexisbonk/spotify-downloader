#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

function log(message) {
  console.log(message);
}

function startBackend() {
  log('🚀 Starting backend server...');
  const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true
  });

  backend.on('close', (code) => {
    if (code !== 0) {
      log(`Backend process exited with code ${code}`);
    } else {
      log('Backend process stopped');
    }
  });

  return backend;
}

function startFrontend() {
  log('🚀 Starting frontend server...');
  const frontend = spawn('npm', ['start'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  frontend.on('close', (code) => {
    if (code !== 0) {
      log(`Frontend process exited with code ${code}`);
    } else {
      log('Frontend process stopped');
    }
  });

  return frontend;
}

function setupGracefulShutdown(backend, frontend) {
  const shutdown = () => {
    log('\n🛑 Shutting down servers...');
    
    if (frontend) {
      frontend.kill('SIGTERM');
    }
    if (backend) {
      backend.kill('SIGTERM');
    }
    
    setTimeout(() => {
      if (frontend && !frontend.killed) {
        frontend.kill('SIGKILL');
      }
      if (backend && !backend.killed) {
        backend.kill('SIGKILL');
      }
      process.exit(0);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  if (process.platform === 'win32') {
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        shutdown();
      }
    });
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('Usage: node start-dev.js [options]');
    log('');
    log('Options:');
    log('  --backend-only    Start only the backend server');
    log('  --frontend-only   Start only the frontend server');
    log('  --help, -h        Show this help message');
    log('');
    log('Examples:');
    log('  node start-dev.js              # Start both servers');
    log('  node start-dev.js --backend-only  # Start only backend');
    log('  node start-dev.js --frontend-only # Start only frontend');
    process.exit(0);
  }

  let backend = null;
  let frontend = null;

  if (args.includes('--backend-only')) {
    backend = startBackend();
    setupGracefulShutdown(backend, null);
  } else if (args.includes('--frontend-only')) {
    frontend = startFrontend();
    setupGracefulShutdown(null, frontend);
  } else {
    
    backend = startBackend();
    
    setTimeout(() => {
      frontend = startFrontend();
      setupGracefulShutdown(backend, frontend);
    }, 2000);
    
    setupGracefulShutdown(backend, frontend);
  }

  log('\n✅ Development servers started!');
  log('Press Ctrl+C to stop all servers');
  log('');
}

module.exports = { startBackend, startFrontend };
