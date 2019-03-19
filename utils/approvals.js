const api = require("../api");
const logger = require("../logger");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const Message = require("../models/message");
const Group = require("../models/group");
const { DEFAULT_PROJECT } = require("../settings");
const { notifyGroup, makeApprovalMessage } = require("../utils/send-notifications");

const THUMBSUP = "thumbsup";
const EMOJI_TYPE = "MergeRequest";

function filterEmojis(mergeRequest) {
  return mergeRequest.emojis.filter(({ name, awardable_type }) => name === THUMBSUP && awardable_type === EMOJI_TYPE);
}

async function checkSuccessfulApprovals(assignedMergeRequest, members) {
  const managers = members.filter(({ productManager }) => productManager);
  const managersUsername = managers.map(({ tgUsername }) => tgUsername);
  for (const mergeRequest of assignedMergeRequest) {
    const { approversCount } = members.find(({ id }) => mergeRequest.isAuthor(id));
    const assigned = members.filter(({ _id }) => mergeRequest.hasApprover(_id)).map(({ id }) => id);
    const approvals = mergeRequest.approved_by.map(({ id }) => id);
    const emojiApprovals = filterEmojis(mergeRequest)
      .filter(({ user: { id } }) => assigned.includes(id))
      .map(({ user: { id } }) => id);
    const approved = approvals.length >= approversCount && assigned.every(id => approvals.includes(id));
    const emojiApproved = emojiApprovals.length >= approversCount && assigned.every(id => emojiApprovals.includes(id));
    if (approved || emojiApproved) {
      try {
        const message = await Message.findByUrl(mergeRequest.web_url);
        if (message) {
          const replyBody = makeApprovalMessage(mergeRequest, managersUsername, true);
          await notifyGroup(message.chat.id, replyBody, message.message_id);
        } else {
          const [group] = await Group.getByProject(DEFAULT_PROJECT);
          const messageBody = makeApprovalMessage(mergeRequest, managersUsername);
          await notifyGroup(group.id, messageBody);
        }
        await mergeRequest.markApprovalAsNotified();
        if (managers.length) {
          await api.assignMergeRequest(mergeRequest.iid, managers[0].id);
        }
      } catch (e) {
        logger.error(e);
      }
    }
  }
}

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
    const allEmojis = await Promise.all(assignedMergeRequests.map(({ iid }) => api.getAwardEmojis(iid)));
    for (const [index, emoji] of allEmojis.entries()) {
      try {
        const mergeRequest = assignedMergeRequests[index];
        await mergeRequest.setEmojis(emoji);
      } catch (e) {
        logger.error(e);
      }
    }
    const notNotified = assignedMergeRequests.filter(({ approvalNotified }) => !approvalNotified);
    await checkSuccessfulApprovals(notNotified, members);
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  updateApprovals
};
