const mongoose = require('../database');

const GroupSchema = new mongoose.Schema({
  id: Number,
  type: String,
  title: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  active: { type: Boolean, default: true },
  approversCount: { type: Number, default: 2 },
  users: [Number],
});

GroupSchema.index({ id: 1 }, { unique: true });

const model = mongoose.model('Group', GroupSchema);

module.exports = model;
