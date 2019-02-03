const mongoose = require("../database");

const MergeRequestSchema = new mongoose.Schema({
  appointed_approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }],
  notified: { type: Boolean, default: false },
  id: Number,
  iid: Number,
  project_id: Number,
  title: String,
  description: String,
  state: String,
  merged_by: {
    id: Number,
    name: String,
    username: String,
    state: String,
    avatar_url: String,
    web_url: String
  },
  merged_at: Date,
  closed_by: {
    id: Number,
    name: String,
    username: String,
    state: String,
    avatar_url: String,
    web_url: String
  },
  closed_at: Date,
  created_at: Date,
  updated_at: Date,
  target_branch: String,
  source_branch: String,
  upvotes: Number,
  downvotes: Number,
  author: {
    id: Number,
    name: String,
    username: String,
    state: String,
    avatar_url: String,
    web_url: String
  },
  assignee: {
    id: Number,
    name: String,
    username: String,
    state: String,
    avatar_url: String,
    web_url: String
  },
  source_project_id: Number,
  target_project_id: Number,
  labels: [String],
  work_in_progress: Boolean,
  milestone: {
    id: Number,
    iid: Number,
    project_id: Number,
    title: String,
    description: String,
    state: String,
    created_at: Date,
    updated_at: Date,
    due_date: Date,
    start_date: Date,
    web_url: String
  },
  merge_when_pipeline_succeeds: Boolean,
  merge_status: String,
  sha: String,
  merge_commit_sha: String,
  user_notes_count: Number,
  discussion_locked: Boolean,
  should_remove_source_branch: Boolean,
  force_remove_source_branch: Boolean,
  allow_collaboration: Boolean,
  allow_maintainer_to_push: Boolean,
  web_url: String,
  time_stats: {
    time_estimate: Number,
    total_time_spent: Number,
    human_time_estimate: Number,
    human_total_time_spent: Number
  },
  squash: Boolean,
  approvals_before_merge: Boolean
});

MergeRequestSchema.statics.getNew = function(members) {
  const memberIds = members.map(member => member.id);
  return this.find({
    state: "opened",
    appointed_approvers: {
      $eq: []
    },
    "author.id": {
      $in: memberIds
    }
  });
};

MergeRequestSchema.statics.getAllApprovers = async function() {
  return this.find({ appointed_approvers: { $ne: [] } }, { appointed_approvers: 1 });
};

MergeRequestSchema.statics.getNotNotified = function() {
  return this.find({ state: "opened", notified: false });
};

MergeRequestSchema.statics.getByMemberId = function(_id) {
  return this.aggregate([
    { $match: { state: "opened" } },
    { $unwind: "$appointed_approvers" },
    { $match: { appointed_approvers: { $eq: _id } } }
  ]);
};

MergeRequestSchema.methods.markAsNotified = function() {
  this.notified = true;
  return this.save();
};

MergeRequestSchema.methods.getAuthorId = function() {
  return this.author.id;
};

MergeRequestSchema.methods.isAuthor = function(memberId) {
  return this.author.id === memberId;
};

MergeRequestSchema.methods.appointApprovers = function(...memberObjectIds) {
  this.appointed_approvers = [...memberObjectIds];
  return this.save();
};

MergeRequestSchema.index({ iid: 1 }, { unique: true });
const model = mongoose.model("MergeRequest", MergeRequestSchema);

module.exports = model;
