const _ = require("lodash");

const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const Group = require("../models/group");
const logger = require("../logger");
const { DEFAULT_PROJECT } = require("../settings");

async function assignApprovers(newMergeRequests, members) {
  const appointedApprovers = await MergeRequest.getAllApprovers();
  const mergeRequestCount = _.countBy(_.flatten(_.map(appointedApprovers, "appointed_approvers")));
  for (const mergeRequest of newMergeRequests) {
    const author = members.find(({ id }) => mergeRequest.isAuthor(id));
    const approvers = members.filter(({ id, approver }) => !mergeRequest.isAuthor(id) && approver);
    const sortedApprovers = _.sortBy(approvers, ({ _id }) => mergeRequestCount[_id] || 0).slice(
      0,
      author.getApproversCount()
    );
    if (sortedApprovers.length >= author.getApproversCount()) {
      try {
        await mergeRequest.appointApprovers(...sortedApprovers);
        sortedApprovers.forEach(({ _id }) => {
          if (mergeRequestCount[_id]) {
            mergeRequestCount[_id]++;
          } else {
            mergeRequestCount[_id] = 1;
          }
        });
      } catch (e) {
        logger.error(e);
      }
    }
  }
}

async function checkNewMergeRequests() {
  const [members, [group]] = await Promise.all([Member.getActive(), Group.getByProject(DEFAULT_PROJECT)]);
  if (!group) {
    logger.warn(`No active group for project ${DEFAULT_PROJECT}`);
  }
  if (!members.length) {
    logger.warn(`No active users for project ${DEFAULT_PROJECT}`);
  }
  const newMergeRequests = await MergeRequest.getNew(members);
  await assignApprovers(newMergeRequests, members);
}

module.exports = {
  checkNewMergeRequests
};
