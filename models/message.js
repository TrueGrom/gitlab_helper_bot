const mongoose = require("../database");

const twoDaysAgo = 172800000;

const MessageSchema = new mongoose.Schema({
  deleted: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  errorBody: {},
  message_id: Number,
  from: {},
  chat: {},
  date: Number,
  text: String,
  entities: Array
});

MessageSchema.statics.getForDeletingByChatId = function(chatId) {
  const unixTime = (Date.now() - twoDaysAgo) / 1000;
  return this.find({ "chat.id": chatId, date: { $gt: unixTime }, deleted: false, error: false });
};

MessageSchema.statics.findByUrl = function(url) {
  return this.findOne({ "entities.url": url, deleted: false, error: false });
};

MessageSchema.methods.markAsDeleted = function() {
  this.deleted = true;
  return this.save();
};

MessageSchema.methods.setError = function(error) {
  this.error = true;
  this.errorBody = error;
  return this.save();
};

MessageSchema.index({ text: "text" });
const model = mongoose.model("Message", MessageSchema);

module.exports = model;
