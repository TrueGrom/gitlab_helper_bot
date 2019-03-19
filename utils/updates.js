const api = require("../api");
const logger = require("../logger");
const MergeRequest = require("../models/merge-request");

async function getApprovals(openedMergeRequests) {
  const approvals = await Promise.all(openedMergeRequests.map(({ iid }) => api.getMergeRequestApprovals(iid)));
  for (const approval of approvals) {
    try {
      const mergeRequest = openedMergeRequests.find(({ iid }) => approval.iid === iid);
      await mergeRequest.setApprovals(approval.approved_by.map(({ user }) => user));
    } catch (e) {
      logger.error(e);
    }
  }
  return openedMergeRequests;
}

async function getAwardEmojis(openedMergeRequests) {
  const allEmojis = await Promise.all(openedMergeRequests.map(({ iid }) => api.getAwardEmojis(iid)));
  for (const [index, emoji] of allEmojis.entries()) {
    try {
      const mergeRequest = openedMergeRequests[index];
      await mergeRequest.setEmojis(emoji);
    } catch (e) {
      logger.error(e);
    }
  }
}

async function getPipelines(openedMergeRequests) {
  const allPipelines = await Promise.all(openedMergeRequests.map(({ iid }) => api.getPipelines(iid)));
  for (const [index, pipeline] of allPipelines.entries()) {
    try {
      const mergeRequest = openedMergeRequests[index];
      await mergeRequest.setPipelines(pipeline);
    } catch (e) {
      logger.error(e);
    }
  }
}

async function getMetaUpdates() {
  try {
    const openedMergeRequests = await MergeRequest.getOpened();
    return Promise.all([
      getApprovals(openedMergeRequests),
      getAwardEmojis(openedMergeRequests),
      getPipelines(openedMergeRequests)
    ]);
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  getMetaUpdates
};
