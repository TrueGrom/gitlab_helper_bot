const mongoose = require("../database");

const MessageSchema = new mongoose.Schema({
  message_id: Number,
  from: {},
  chat: {},
  date: Number,
  text: String,
  entities: Array
});

const model = mongoose.model("Message", MessageSchema);

module.exports = model;
