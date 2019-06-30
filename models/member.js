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
  notifications: { type: Boolean, default: false },
  productManager: { type: Boolean, default: false },
  tester: { type: Boolean, default: false },
  unsafe: { type: Boolean, default: false }
});

MemberSchema.statics.getNotAttached = function() {
  return this.find({ tgUsername: { $eq: null } });
};

MemberSchema.statics.getApprovers = function(query) {
  return this.find({ active: true, approver: true, tgUsername: { $ne: null }, ...query });
};

MemberSchema.statics.getNotApprovers = function() {
  return this.find({
    active: true,
    approver: false,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getNotManagers = function() {
  return this.find({
    active: true,
    productManager: false,
    tester: false,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getManagers = function() {
  return this.find({
    active: true,
    productManager: true,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getNotTesters = function() {
  return this.find({
    active: true,
    productManager: false,
    tester: false,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getTesters = function() {
  return this.find({
    active: true,
    tester: true,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getSafe = function() {
  return this.find({
    active: true,
    productManager: false,
    tester: false,
    unsafe: false,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getUnsafe = function() {
  return this.find({
    active: true,
    productManager: false,
    tester: false,
    unsafe: true,
    tgUsername: { $ne: null }
  });
};

MemberSchema.statics.getActive = function() {
  return this.find({ active: true });
};

MemberSchema.statics.getActiveAttached = function() {
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

MemberSchema.statics.grantProductManager = function(query) {
  return this.updateOne(query, {
    $set: {
      productManager: true
    }
  });
};

MemberSchema.statics.revokeProductManager = function(query) {
  return this.updateOne(query, {
    $set: {
      productManager: false
    }
  });
};

MemberSchema.statics.grantTester = function(query) {
  return this.updateOne(query, {
    $set: {
      tester: true
    }
  });
};

MemberSchema.statics.revokeTester = function(query) {
  return this.updateOne(query, {
    $set: {
      tester: false
    }
  });
};

MemberSchema.statics.markUnsafe = function(query) {
  return this.updateOne(query, {
    $set: {
      unsafe: true
    }
  });
};

MemberSchema.statics.markSafe = function(query) {
  return this.updateOne(query, {
    $set: {
      unsafe: false
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
