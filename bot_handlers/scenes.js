const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const Member = require("../models/member");
const Group = require("../models/group");
const logger = require("../logger");

async function selectGitlabMember(ctx) {
  try {
    const members = await Member.getNotAttached();
    if (members.length) {
      return ctx.reply(
        "GITLAB users:",
        Markup.inlineKeyboard(
          [...members.map(member => Markup.callbackButton(member.username, `attach_${member.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("All users already attached");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
}

async function rejectAttachment(ctx, member) {
  try {
    return ctx.replyWithHTML(`${member.tgUsername} is already attached to  <b>${member.username}</b>`);
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  } finally {
    ctx.scene.leave();
  }
}

async function attachUserManually(ctx) {
  try {
    const tgUsername = ctx.findUsername();
    if (tgUsername) {
      ctx.session.tgUsername = tgUsername;
      const member = await Member.findOne({ tgUsername });
      return member ? rejectAttachment(ctx, member) : selectGitlabMember(ctx);
    }
    return ctx.reply("Enter a valid Telegram username");
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

const attach = new Scene("attach");
attach.enter(attachUserManually);
attach.leave(ctx => {
  ctx.session = null;
});

const deactivate = new Scene("deactivate");
deactivate.enter(async ctx => {
  const groups = await Group.find({ active: true });
  if (groups.length) {
    return ctx.reply(
      "Active groups:",
      Markup.inlineKeyboard([...groups.map(group => Markup.callbackButton(group.title, `deactivate_${group.id}`))], {
        columns: 3
      }).extra()
    );
  }
  ctx.scene.leave();
  return ctx.reply("No active groups");
});

const revoke = new Scene("revoke");
revoke.enter(async ctx => {
  try {
    const approvers = await Member.getApprovers();
    if (approvers.length) {
      return ctx.reply(
        "Select a developer",
        Markup.inlineKeyboard(
          [...approvers.map(member => Markup.callbackButton(member.username, `revoke_${member.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("No approvers");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const grant = new Scene("grant");
grant.enter(async ctx => {
  try {
    const notApprovers = await Member.getNotApprovers();
    if (notApprovers.length) {
      return ctx.reply(
        "Select a developer",
        Markup.inlineKeyboard(
          [...notApprovers.map(user => Markup.callbackButton(user.username, `grant_${user.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("All developers are approvers");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const grantProductManager = new Scene("grant_pm");
grantProductManager.enter(async ctx => {
  try {
    const notManagers = await Member.getNotManagers();
    if (notManagers.length) {
      return ctx.reply(
        "Select a user",
        Markup.inlineKeyboard(
          [...notManagers.map(user => Markup.callbackButton(user.username, `grantpm_${user.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("All developers are product managers. WTF?");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const revokeProductManager = new Scene("revoke_pm");
revokeProductManager.enter(async ctx => {
  try {
    const managers = await Member.getManagers();
    if (managers.length) {
      return ctx.reply(
        "Select a user",
        Markup.inlineKeyboard(
          [...managers.map(user => Markup.callbackButton(user.username, `revokepm_${user.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("No managers");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const grantTester = new Scene("grant_tester");
grantTester.enter(async ctx => {
  try {
    const notTesters = await Member.getNotTesters();
    if (notTesters.length) {
      return ctx.reply(
        "Select a user",
        Markup.inlineKeyboard(
          [...notTesters.map(user => Markup.callbackButton(user.username, `granttester_${user.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("All developers are testers. WTF?");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const revokeTester = new Scene("revoke_tester");
revokeTester.enter(async ctx => {
  try {
    const testers = await Member.getTesters();
    if (testers.length) {
      return ctx.reply(
        "Select a user",
        Markup.inlineKeyboard(
          [...testers.map(user => Markup.callbackButton(user.username, `revoketester_${user.username}`))],
          { columns: 3 }
        ).extra()
      );
    }
    return ctx.reply("No testers");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const unsafe = new Scene("unsafe");
unsafe.enter(async ctx => {
  try {
    const safe = await Member.getSafe();
    if (safe.length) {
      return ctx.reply(
        "Select a user",
        Markup.inlineKeyboard([...safe.map(user => Markup.callbackButton(user.username, `unsafe_${user.username}`))], {
          columns: 3
        }).extra()
      );
    }
    return ctx.reply("All developers are unsafe. WTF? Layoff time...");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const safe = new Scene("safe");
safe.enter(async ctx => {
  try {
    const testers = await Member.getUnsafe();
    if (testers.length) {
      return ctx.reply(
        "Select a user",
        Markup.inlineKeyboard([...testers.map(user => Markup.callbackButton(user.username, `safe_${user.username}`))], {
          columns: 3
        }).extra()
      );
    }
    return ctx.reply("No unsafe developers");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

const deleteMessages = new Scene("deleteMessages");
deleteMessages.enter(async ctx => {
  const groups = await Group.find({ active: true });
  if (groups.length) {
    return ctx.reply(
      "Select group:",
      Markup.inlineKeyboard(
        [...groups.map(group => Markup.callbackButton(group.title, `delete_messages_${group.id}`))],
        {
          columns: 3
        }
      ).extra()
    );
  }
  ctx.scene.leave();
  return ctx.reply("No active groups");
});

module.exports = {
  attach,
  deactivate,
  revoke,
  grant,
  deleteMessages,
  grantProductManager,
  revokeProductManager,
  grantTester,
  revokeTester,
  unsafe,
  safe
};
