const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const { makeProblemMessage, notifyMember } = require("./send-notifications");
const logger = require("../logger");

async function reportProblems() {
  try {
    await MergeRequest.updateProblemStatuses();
    const members = await Member.getActive();
    const memberIds = members.filter(({ notifications }) => notifications).map(({ id }) => id);
    const canNotBeMerged = await MergeRequest.getCanNotBeMerged(memberIds);
    for (const mergeRequest of canNotBeMerged) {
      const { tgId } = members.find(({ id }) => mergeRequest.author.id === id);
      const message = makeProblemMessage(mergeRequest);
      try {
        await notifyMember(tgId, message);
        await mergeRequest.markProblemAsNotified();
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  reportProblems
};
