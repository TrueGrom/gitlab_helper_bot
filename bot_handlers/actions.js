const Member = require("../models/member");
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

module.exports = {
  attachUser,
  deactivateChat,
  revokeApprover,
  grantApprover
};
