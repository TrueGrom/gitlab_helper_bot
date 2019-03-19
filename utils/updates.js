const api = require("../api");
const logger = require("../logger");
const MergeRequest = require("../models/merge-request");

async function getApprovals(openedMergeRequests) {
  return Promise.all(openedMergeRequests.map(({ iid }) => api.getMergeRequestApprovals(iid)));
}

async function getAwardEmojis(openedMergeRequests) {
  return Promise.all(openedMergeRequests.map(({ iid }) => api.getAwardEmojis(iid)));
}

async function getPipelines(openedMergeRequests) {
  return Promise.all(openedMergeRequests.map(({ iid }) => api.getPipelines(iid)));
}

async function getMetaUpdates() {
  try {
    const openedMergeRequests = await MergeRequest.getOpened();
    const [allApprovals, allEmojis, allPipelines] = await Promise.all([
      getApprovals(openedMergeRequests),
      getAwardEmojis(openedMergeRequests),
      getPipelines(openedMergeRequests)
    ]);
    for (const [index, mergeRequest] of openedMergeRequests.entries()) {
      try {
        const approvals = allApprovals[index];
        const emojis = allEmojis[index];
        const pipelines = allPipelines[index];
        await mergeRequest.setMetaData({ approvals, emojis, pipelines });
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  getMetaUpdates
};
