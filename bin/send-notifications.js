const Telegram = require("telegraf/telegram");

const Group = require("../models/group");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const logger = require("../logger");
const { TELEGRAM_TOKEN, DEFAULT_PROJECT } = require("../settings");

const telegram = new Telegram(TELEGRAM_TOKEN);

function makeNotifyMessage(author, approvers, mergeRequest) {
  const approverNames = approvers.map(approver => `${approver.tgUsername}`).join(", ");
  const {
    author: { name },
    title,
    web_url
  } = mergeRequest;
  return `${approverNames}\n<b>New merge request from</b> <i>${name}</i> (${
    author.tgUsername
  })\n${title}\n<a href="${web_url}">${web_url}</a>`;
}

async function notifyApprovers(groupId, message) {
  return telegram.sendMessage(groupId, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true
  });
}

async function sendNotifications() {
  const [[group], notNotifiedMergeRequests] = await Promise.all([
    Group.getByProject(DEFAULT_PROJECT),
    MergeRequest.getNotNotified()
  ]);
  for (const mergeRequest of notNotifiedMergeRequests) {
    const [author, approvers] = await Promise.all([
      Member.findOne({ id: mergeRequest.getAuthorId() }),
      Member.find({ _id: { $in: mergeRequest.appointed_approvers } })
    ]);
    try {
      await notifyApprovers(group.id, makeNotifyMessage(author, approvers, mergeRequest));
      await mergeRequest.markAsNotified();
    } catch (e) {
      logger.error(e);
    }
  }
}

module.exports = {
  sendNotifications
};
