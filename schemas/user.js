const mongoose = require('../database');

const UserSchema = new mongoose.Schema({
  username: String,
  id: Number,
  first_mame: String,
  last_name: String,
  type: String,
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  notifications: { type: Boolean, default: true },
  approver: { type: Boolean, default: false },
  approversCount: Number,
  active: { type: Boolean, default: true },
  mergeRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MergeRequest' }],
});

UserSchema.index({ id: 1, username: 1 }, { unique: true });
const model = mongoose.model('User', UserSchema);

module.exports = model;
