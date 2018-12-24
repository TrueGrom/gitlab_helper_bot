const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { LOGS_DIR } = require('./constants');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

const COMMON_LOGS = path.join(LOGS_DIR, 'common.log');
const ERROR_LOGS = path.join(LOGS_DIR, 'error.log');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: COMMON_LOGS }),
    new winston.transports.File({ filename: ERROR_LOGS, level: 'error' }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;
