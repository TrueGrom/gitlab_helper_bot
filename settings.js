module.exports = {
  LOGS_DIR: process.env.LOGS_DIR || "logs",
  BOT_PORT: parseInt(process.env.BOT_PORT, 10),
  EXPRESS_PATH: `/${process.env.SECRET_PATH}`,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  SECRET_LOCATION: process.env.SECRET_LOCATION,
  SECRET_PATH: process.env.SECRET_PATH,
  GITLAB_TOKEN: process.env.GITLAB_TOKEN,
  ADMIN_ID: parseInt(process.env.ADMIN_ID, 10),
  DB_NAME: process.env.DB_NAME,
  DB_PASS: process.env.DB_PASS,
  DB_USER: process.env.DB_USER,
  DEFAULT_PROJECT: process.env.DEFAULT_PROJECT,
  DEFAULT_MESSAGE: "¯\\_(ツ)_/¯"
};
