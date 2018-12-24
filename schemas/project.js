const mongoose = require('../database');

const ProjectSchema = new mongoose.Schema({
  id: Number,
  description: String,
  name: String,
  name_with_namespace: String,
  path: String,
  path_with_namespace: String,
  created_at: Date,
  default_branch: String,
  tag_list: [String],
  ssh_url_to_repo: String,
  http_url_to_repo: String,
  web_url: String,
  readme_url: String,
  avatar_url: String,
  star_count: Number,
  forks_count: Number,
  last_activity_at: Date,
  namespace:
    {
      id: Number,
      name: String,
      path: String,
      kind: String,
      full_path: String,
      parent_id: Number,
    },
  _links:
    {
      self: String,
      issues: String,
      mergeRequests: String,
      repo_branches: String,
      labels: String,
      events: String,
      members: String,
    },
  archived: Boolean,
  visibility: String,
  resolve_outdated_diff_discussions: Boolean,
  container_registry_enabled: Boolean,
  issues_enabled: Boolean,
  merge_requests_enabled: Boolean,
  wiki_enabled: Boolean,
  jobs_enabled: Boolean,
  snippets_enabled: Boolean,
  shared_runners_enabled: Boolean,
  lfs_enabled: Boolean,
  creator_id: Number,
  import_status: String,
  open_issues_count: Number,
  public_jobs: Boolean,
  ci_config_path: String,
  shared_with_groups: [String],
  only_allow_merge_if_pipeline_succeeds: Boolean,
  request_access_enabled: Boolean,
  only_allow_merge_if_all_discussions_are_resolved: Boolean,
  printing_merge_request_link_enabled: Boolean,
  merge_method: String,
  permissions:
    {
      project_access: { access_level: Number, notification_level: Number },
      group_access: Boolean,
    },
  mirror: Boolean,
});

ProjectSchema.index({ id: 1 }, { unique: true });
const model = mongoose.model('Project', ProjectSchema);

module.exports = model;
