const Telegram = require("telegraf/telegram");

const Group = require("../models/group");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");
const Message = require("../models/message");
const logger = require("../logger");
const { TELEGRAM_TOKEN, DEFAULT_PROJECT } = require("../settings");

const telegram = new Telegram(TELEGRAM_TOKEN);

function makeNotifyMessage(author, approvers, mergeRequest) {
  const approverNames = approvers.map(({ tgUsername }) => `${tgUsername}`).join(", ");
  const hashTags = approvers.reduce((acc, { tgUsername }) => `${acc} #for_${tgUsername.replace("@", "")}`, "\n#newMR ");
  const {
    author: { name },
    title,
    web_url
  } = mergeRequest;
  return `${approverNames}\n<b>New merge request from</b> <i>${name}</i> (${
    author.tgUsername
  })\n${title}\n<a href="${web_url}">${web_url}</a>\n${hashTags}`;
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
  const messages = [];
  for (const mergeRequest of notNotifiedMergeRequests) {
    const [author, approvers] = await Promise.all([
      Member.findOne({ id: mergeRequest.getAuthorId() }),
      Member.find({ _id: { $in: mergeRequest.appointed_approvers } })
    ]);
    try {
      const message = await notifyApprovers(group.id, makeNotifyMessage(author, approvers, mergeRequest));
      messages.push(message);
      await mergeRequest.markAsNotified();
    } catch (e) {
      logger.error(e);
    }
  }
  await Message.insertMany(messages);
}

module.exports = {
  sendNotifications
};
