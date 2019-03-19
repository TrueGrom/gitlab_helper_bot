const fs = require("fs");
const path = require("path");
const bunyan = require("bunyan");
const { LOGS_DIR } = require("./settings");

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

const LOGS = path.join(LOGS_DIR, "common.log");

const logger = bunyan.createLogger({
  name: `gitlab-helper-bot:${process.env.NODE_ENV}`,
  streams: [
    {
      level: "info",
      stream: process.stdout
    },
    {
      level: "info",
      path: LOGS
    }
  ]
});

module.exports = logger;
