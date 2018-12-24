const Telegram = require('telegraf/telegram');
const { DEFAULT_PROJECT, TELEGRAM_TOKEN } = require('../constants');
const MergeRequest = require('../schemas/merge_request');
const Member = require('../schemas/member');
const Project = require('../schemas/project');
const User = require('../schemas/user');
const Group = require('../schemas/group');
const { getGroupByProject, getNewMergeRequests, getActiveApprovers } = require('../schemas/queries');
const { compareMergeRequest } = require('../helpers');
const logger = require('../logger');

const telegram = new Telegram(TELEGRAM_TOKEN);

function assignAndNotifyMergeRequest(users, mr, group) {
  const author = users.find(user => mr.author.id === user.member.id);
  const approversCount = author.approversCount || group.approversCount;
  const approvers = users
    .filter(user => mr.author.id !== user.member.id)
    .sort(compareMergeRequest)
    .slice(0, approversCount);
  approvers.forEach(approver => approver.mergeRequests.push(mr._id));
  const approversNames = approvers.map(approver => `@${approver.username}`).join(', ');
  const message = `${approversNames}\n<b>New merge request from</b> <i>${mr.author.name}</i> (@${author.username})\n${mr.title}\n<a href="${mr.web_url}">${mr.web_url}</a>`;
  return telegram.sendMessage(group.id, message, { parse_mode: 'HTML', disable_web_page_preview: true });
}

async function handleNewMergeRequests(mergeRequests, users, group) {
  try {
    await Promise.all(mergeRequests.map(mr => assignAndNotifyMergeRequest(users, mr, group)));
    await Promise.all(users.map(user => user.save()));
  } catch (e) {
    logger.error(e);
  }
}

async function checkNewMergeRequests() {
  try {
    const [users, [group]] = await Promise.all([getActiveApprovers(), getGroupByProject(DEFAULT_PROJECT)]);
    if (!group) {
      logger.warn(`No active group for project ${DEFAULT_PROJECT}`);
      process.exit(0);
    }
    const newMergeRequests = await getNewMergeRequests(users);
    await handleNewMergeRequests(newMergeRequests, users, group);
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  checkNewMergeRequests,
};
