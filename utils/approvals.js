const api = require("../api");
const logger = require("../logger");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const Message = require("../models/message");
const Group = require("../models/group");
const { DEFAULT_PROJECT } = require("../settings");
const { notifyGroup, makeApprovalMessage } = require("../utils/send-notifications");
const { getManagers, getTesters, getUsernames } = require("../helpers");

const THUMBSUP = "thumbsup";
const EMOJI_TYPE = "MergeRequest";

function filterEmojis(mergeRequest) {
  return mergeRequest.emojis.filter(({ name, awardable_type }) => name === THUMBSUP && awardable_type === EMOJI_TYPE);
}

async function checkSuccessfulApprovals(assignedMergeRequest, members) {
  const managers = getManagers(members);
  const testers = getTesters(members);
  for (const mergeRequest of assignedMergeRequest) {
    const { approversCount, unsafe } = members.find(({ id }) => mergeRequest.isAuthor(id));
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
        const usernames = unsafe ? getUsernames([...managers, ...testers]) : getUsernames(managers);
        if (message) {
          const replyBody = makeApprovalMessage(mergeRequest, usernames, true);
          await notifyGroup(message.chat.id, replyBody, message.message_id);
        } else {
          const [group] = await Group.getByProject(DEFAULT_PROJECT);
          const messageBody = makeApprovalMessage(mergeRequest, usernames);
          await notifyGroup(group.id, messageBody);
        }
        await mergeRequest.markApprovalAsNotified();
        if (unsafe && testers.length) {
          await api.assignMergeRequest(mergeRequest.iid, testers[0].id);
        } else if (managers.length) {
          await api.assignMergeRequest(mergeRequest.iid, managers[0].id);
        }
      } catch (e) {
        logger.error(e);
      }
    }
  }
}

async function handleApprovals() {
  const members = await Member.getActive();
  const notNotified = await MergeRequest.getAssignedNotNotified(members.map(({ id }) => id));
  await checkSuccessfulApprovals(notNotified, members);
}

module.exports = {
  handleApprovals
};
