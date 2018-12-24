const api = require('./api');

function getAllMergeRequests(projectId) {
  return api.MergeRequests.all({ projectId, scope: 'all' });
}

module.exports = {
  getAllMergeRequests,
};
