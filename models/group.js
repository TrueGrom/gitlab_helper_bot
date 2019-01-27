const mongoose = require("../database");

const GroupSchema = new mongoose.Schema({
  id: Number,
  type: String,
  title: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  active: { type: Boolean, default: true },
  users: [Number]
});

GroupSchema.statics.getByProject = function(projectId) {
  return this.aggregate()
    .match({ active: true })
    .lookup({
      from: "projects",
      localField: "project",
      foreignField: "_id",
      as: "project"
    })
    .match({ "project.path_with_namespace": { $eq: projectId } });
};

GroupSchema.index({ id: 1 }, { unique: true });

const model = mongoose.model("Group", GroupSchema);

module.exports = model;
