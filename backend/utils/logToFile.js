const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function logToFile(message, color) {
  const logDir = path.join(__dirname, '..', 'data');
  const logFile = path.join(logDir, 'server.log');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  if (color && chalk[color]) {
    console.log(chalk[color](message));
  } else if (color && color === 'blueBright') {
    console.log(chalk.blueBright(message));
  } else {
    console.log(message);
  }
}

module.exports = logToFile;
