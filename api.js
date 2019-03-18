const Gitlab = require("gitlab/dist/es5").default;
const { GITLAB_TOKEN, DEFAULT_PROJECT } = require("./settings");

class Api {
  constructor({ token, projectId }) {
    this._api = new Gitlab({ token });
    this._projectId = projectId;
  }

  getAllMergeRequests({ scope = "all" } = {}) {
    return this._api.MergeRequests.all({ projectId: this._projectId, scope });
  }

  getProject() {
    return this._api.Projects.show(this._projectId);
  }

  getProjectMembers({ state = "active" } = {}) {
    return this._api.ProjectMembers.all(this._projectId, { state });
  }

  getMergeRequestApprovals(iid) {
    return this._api.MergeRequests.approvals(this._projectId, { mergerequestId: iid });
  }

  assignMergeRequest(iid, userId) {
    return this._api.MergeRequests.edit(this._projectId, iid, { assignee_id: userId });
  }

  getAwardEmojis(iid) {
    return this._api.MergeRequestAwardEmojis.all(this._projectId, iid);
  }
}

const api = new Api({ token: GITLAB_TOKEN, projectId: DEFAULT_PROJECT });
module.exports = api;
