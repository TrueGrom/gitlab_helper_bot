const fs = require("fs");
const path = require("path");
const pinoms = require("pino-multi-stream");
const { LOGS_DIR } = require("./settings");

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

const LOGS = path.join(LOGS_DIR, "common.log");
const streams = [{ stream: process.stdout }, { stream: fs.createWriteStream(LOGS) }];

const logger = pinoms({ streams });

module.exports = logger;
