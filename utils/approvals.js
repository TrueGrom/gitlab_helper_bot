const api = require("../api");
const logger = require("../logger");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");

async function updateApprovals() {
  try {
    const members = await Member.getActive();
    const assignedMergeRequests = await MergeRequest.getAssigned(members.map(member => member.id));
    const approvals = await Promise.all(assignedMergeRequests.map(({ iid }) => api.getMergeRequestApprovals(iid)));
    for (const approval of approvals) {
      try {
        const mergeRequest = assignedMergeRequests.find(({ iid }) => approval.iid === iid);
        await mergeRequest.setApprovals(approval.approved_by.map(({ user }) => user));
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  updateApprovals
};
