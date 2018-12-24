const mongoose = require('mongoose');
const { DB_NAME, DB_PASS, DB_USER } = require('./constants');
const logger = require('./logger');

mongoose.connect(
  `mongodb://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}`,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
  },
);
const db = mongoose.connection;
db.on('error', error => logger.error(error));

module.exports = mongoose;
