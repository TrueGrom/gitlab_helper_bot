const mongoose = require('../database');

const MemberSchema = new mongoose.Schema({
  id: Number,
  name: String,
  username: String,
  state: String,
  avatar_url: String,
  web_url: String,
  access_level: Number,
  expires_at: Date,
});

MemberSchema.index({ username: 1 }, { unique: true });
const model = mongoose.model('Member', MemberSchema);

module.exports = model;
