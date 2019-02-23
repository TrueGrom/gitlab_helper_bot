const mongoose = require("../database");

const MemberSchema = new mongoose.Schema({
  id: Number,
  name: String,
  username: String,
  state: String,
  avatar_url: String,
  web_url: String,
  access_level: Number,
  expires_at: Date,
  tgUsername: String,
  tgId: Number,
  tgFirstName: String,
  tgLastName: String,
  approver: { type: Boolean, default: false },
  approversCount: { type: Number, default: 2 },
  active: { type: Boolean, default: true },
  notifications: { type: Boolean, default: false }
});

MemberSchema.statics.getNotAttached = function() {
  return this.find({ tgUsername: { $eq: null } });
};

MemberSchema.statics.getApprovers = function() {
  return this.find({ active: true, approver: true, tgUsername: { $ne: null } });
};

MemberSchema.statics.getNotApprovers = function() {
  return this.find({
    active: true,
    approver: false,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getActive = function() {
  return this.find({ active: true, tgUsername: { $ne: null } });
};

MemberSchema.statics.revokeApprover = function(query) {
  return this.updateOne(query, {
    $set: {
      approver: false
    }
  });
};

MemberSchema.statics.grantApprover = function(query) {
  return this.updateOne(query, {
    $set: {
      approver: true
    }
  });
};

MemberSchema.methods.getApproversCount = function() {
  return this.approversCount;
};

MemberSchema.methods.setTelegramInfo = function({ id, username, first_name, last_name }) {
  this.tgId = id;
  this.tgUsername = username;
  this.tgFirstName = first_name;
  this.tgLastName = last_name;
  return this.save();
};

MemberSchema.methods.enableNotifications = function() {
  this.notifications = true;
  return this.save();
};

MemberSchema.methods.disableNotifications = function() {
  this.notifications = false;
  return this.save();
};

MemberSchema.index({ id: 1 }, { unique: true });
MemberSchema.index({ username: 1 }, { unique: true });
MemberSchema.index({ tgUsername: 1 }, { unique: true, partialFilterExpression: { tgUsername: { $ne: null } } });
MemberSchema.index({ tgId: 1 }, { unique: true, partialFilterExpression: { tgId: { $ne: null } } });
const model = mongoose.model("Member", MemberSchema);

module.exports = model;
