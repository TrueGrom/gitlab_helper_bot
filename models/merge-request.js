const mongoose = require("../database");

const canBeMerged = "can_be_merged";
const canNotBeMerged = "cannot_be_merged";

const MergeRequestSchema = new mongoose.Schema({
  appointed_approvers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member" }],
  notified: { type: Boolean, default: false },
  forNotify: { type: Boolean, default: false },
  exclude: { type: Boolean, default: false },
  problemsNotified: { type: Boolean, default: false },
  approvalNotified: { type: Boolean, default: false },
  approved_by: [
    {
      name: String,
      username: String,
      id: Number,
      state: String,
      avatar_url: String,
      web_url: String
    }
  ],
  emojis: [
    {
      id: Number,
      name: String,
      user: {
        id: Number,
        name: String,
        username: String,
        state: String,
        avatar_url: String,
        web_url: String
      },
      created_at: Date,
      updated_at: Date,
      awardable_id: Number,
      awardable_type: String
    }
  ],
  pipelines: [
    {
      id: Number,
      sha: String,
      ref: String,
      status: String,
      web_url: String
    }
  ],
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
  approvals_before_merge: String
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
    },
    merge_status: canBeMerged,
    exclude: false
  });
};

MergeRequestSchema.statics.getAllApprovers = async function() {
  return this.find({ state: "opened", appointed_approvers: { $ne: [] } }, { appointed_approvers: 1 });
};

MergeRequestSchema.statics.getOpened = function() {
  return this.find({ state: "opened", exclude: false });
};

MergeRequestSchema.statics.getNotNotified = function() {
  return this.find({ state: "opened", forNotify: true, notified: false, merge_status: canBeMerged, exclude: false });
};

MergeRequestSchema.statics.getNotApprovedByMember = function({ _id, id }) {
  return this.find({
    state: "opened",
    appointed_approvers: _id,
    "approved_by.id": { $ne: id },
    emojis: { $not: { $elemMatch: { "user.id": id, name: "thumbsup", awardable_type: "MergeRequest" } } }
  });
};

MergeRequestSchema.statics.getAssignedNotNotified = function(memberIds) {
  return this.find({
    state: "opened",
    approvalNotified: false,
    appointed_approvers: {
      $ne: []
    },
    "author.id": {
      $in: memberIds
    },
    merge_status: canBeMerged,
    exclude: false
  });
};

MergeRequestSchema.statics.getCanNotBeMerged = function(memberIds) {
  return this.find({
    state: "opened",
    "author.id": {
      $in: memberIds
    },
    merge_status: canNotBeMerged,
    exclude: false,
    problemsNotified: false
  });
};

MergeRequestSchema.statics.updateProblemStatuses = function() {
  return this.updateMany(
    {
      state: "opened",
      merge_status: canBeMerged
    },
    {
      $set: {
        problemsNotified: false
      }
    }
  );
};

MergeRequestSchema.methods.markAsNotified = function() {
  this.notified = true;
  return this.save();
};

MergeRequestSchema.methods.markProblemAsNotified = function() {
  this.problemsNotified = true;
  return this.save();
};

MergeRequestSchema.methods.markApprovalAsNotified = function() {
  this.approvalNotified = true;
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
  this.forNotify = true;
  return this.save();
};

MergeRequestSchema.methods.setApprovals = function(approvals) {
  this.approved_by = approvals;
  return this.save();
};

MergeRequestSchema.methods.setEmojis = function(emojis) {
  this.emojis = emojis;
  return this.save();
};

MergeRequestSchema.methods.setPipelines = function(pipelines) {
  this.pipelines = pipelines;
  return this.save();
};

MergeRequestSchema.methods.setMetaData = function({ approvals, emojis, pipelines }) {
  this.pipelines = pipelines;
  this.emojis = emojis;
  this.approved_by = approvals;
  return this.save();
};

MergeRequestSchema.methods.hasApprover = function(objectId) {
  return this.appointed_approvers.some(_id => objectId.equals(_id));
};

MergeRequestSchema.index({ iid: 1 }, { unique: true });
const model = mongoose.model("MergeRequest", MergeRequestSchema);

module.exports = model;
