const mongoose = require("mongoose");
const { DB_URL } = require("./settings");
const logger = require("./logger");

mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true
});
const db = mongoose.connection;
db.on("error", error => logger.error(error));

module.exports = mongoose;
