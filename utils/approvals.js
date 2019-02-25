const api = require("../api");
const logger = require("../logger");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const Message = require("../models/message");
const Group = require("../models/group");
const { DEFAULT_PROJECT } = require("../settings");
const { notifyGroup, makeApprovalMessage } = require("../utils/send-notifications");

async function checkSuccessfulApprovals(assignedMergeRequest, members) {
  const managers = members.filter(({ productManager }) => productManager);
  const managersUsername = managers.map(({ tgUsername }) => tgUsername);
  for (const mergeRequest of assignedMergeRequest) {
    const author = members.find(({ id }) => mergeRequest.isAuthor(id));
    const approvers = members.filter(({ _id }) => mergeRequest.appointed_approvers.includes(_id));
    const approversIds = approvers.map(({ id }) => id);
    const approvals = mergeRequest.approved_by.map(({ id }) => id);
    if (approvals.length >= author.approversCount && approversIds.every(id => approvals.includes(id))) {
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
        if (managers.length) {
          await api.assignMergeRequest(mergeRequest.iid, managers[0].id);
        }
        await mergeRequest.markApprovalAsNotified();
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
    const notNotified = assignedMergeRequests.filter(({ approvalNotified }) => !approvalNotified);
    await checkSuccessfulApprovals(notNotified, members);
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  updateApprovals
};
