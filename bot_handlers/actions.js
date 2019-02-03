const Member = require("../models/member");
const MergeRequest = require("../models/merge-request");
const Group = require("../models/group");
const logger = require("../logger");

async function attachUser(ctx) {
  try {
    const member = await Member.findOne({ username: ctx.match[2] });
    const { tgUsername } = ctx.session;
    await member.setTelegramInfo({ username: tgUsername });
    logger.info(`${tgUsername} attached to ${member.username}`);
    return ctx.editMessageText(`${tgUsername} has been attached to <b>${member.username}</b>`, { parse_mode: "HTML" });
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText("Something went wrong");
  } finally {
    ctx.scene.leave();
  }
}

async function deactivateChat(ctx) {
  try {
    await Group.updateOne({ id: ctx.match[2] }, { $set: { active: false } });
    logger.warn(`Chat ${ctx.chat.id} has been deactivated`);
    return ctx.editMessageText("This chat has been deactivated");
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  }
}

async function revokeApprover(ctx) {
  try {
    await Member.revokeApprover({ username: ctx.match[2] });
    return ctx.editMessageText(`Approver has been revoked from ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function grantApprover(ctx) {
  try {
    await Member.grantApprover({ username: ctx.match[2] });
    return ctx.editMessageText(`Approver has been granted to ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function myMergeRequests(ctx) {
  const { username } = ctx.chat;
  try {
    const { _id, approver } = await Member.findOne({ tgUsername: `@${username}` });
    if (!approver) {
      return ctx.reply("You are not a approver");
    }
    const mergeRequests = await MergeRequest.getByMemberId(_id);
    if (mergeRequests.length) {
      const message = mergeRequests.reduce((acc, { title, web_url }) => `${acc}${title}\n${web_url}\n\n`, "");
      return ctx.reply(message, { disable_web_page_preview: true });
    }
    return ctx.reply("Relax. No merge requests for you");
  } catch (e) {
    logger.error(e);
    ctx.reportError(e);
  }
}

module.exports = {
  attachUser,
  deactivateChat,
  revokeApprover,
  grantApprover,
  myMergeRequests
};
