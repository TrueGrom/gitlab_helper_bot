const bunyan = require("bunyan");

const logger = bunyan.createLogger({
  name: `gitlab-helper-bot:${process.env.NODE_ENV}`,
  streams: [
    {
      level: "info",
      stream: process.stdout
    },
    {
      level: "error",
      stream: process.stderr
    }
  ]
});

module.exports = logger;
