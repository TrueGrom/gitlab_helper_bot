const Scene = require("telegraf/scenes/base");
const Markup = require("telegraf/markup");
const Member = require("../models/member");
const MergeRequest = require("../models/merge-request");
const Message = require("../models/message");
const Group = require("../models/group");
const logger = require("../logger");
const { notifyGroup } = require("../utils/send-notifications");

const clearSession = () => ctx => {
  ctx.session = null;
};

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

const reassign = new Scene("reassign");
reassign.enter(async ctx => {
  try {
    const author = await Member.findOne({ tgUsername: ctx.chat.username });
    const mergeRequests = await MergeRequest.getAssignedByAuthor(author.id);
    if (mergeRequests.length) {
      return ctx.reply(
        "Select a merge request",
        Markup.inlineKeyboard(
          [...mergeRequests.map(mr => Markup.callbackButton(`${mr.title.slice(0, 30)}...`, `reassign_${mr.iid}`))],
          {
            columns: 1
          }
        ).extra()
      );
    }
    return ctx.reply("No opened merge requests");
  } catch (e) {
    logger.error(e);
    ctx.scene.leave(clearSession());
    return ctx.reportError(e);
  }
});

reassign.action(/(reassign_)(\d+)/, async ctx => {
  const iid = ctx.match[2];
  try {
    const mergeRequest = await MergeRequest.findOne({ iid }).populate("appointed_approvers");
    ctx.session.mergeRequestIid = mergeRequest.iid;
    ctx.session.excludeIds = [mergeRequest.author.id, ...mergeRequest.appointed_approvers.map(({ id }) => id)];
    return ctx.editMessageText(
      "Select developer to replace",
      Markup.inlineKeyboard(
        [
          ...mergeRequest.appointed_approvers.map(({ name, id }) =>
            Markup.callbackButton(`${name}...`, `reassign_user_${id}`)
          )
        ],
        {
          columns: 2
        }
      ).extra()
    );
  } catch (e) {
    ctx.editMessageText("An error has occurred").catch(logger.error);
    logger.error(e);
    ctx.scene.leave(clearSession());
    return ctx.reportError(e);
  }
});

reassign.action(/(reassign_user_)(\d+)/, async ctx => {
  try {
    const replacedId = ctx.match[2];
    ctx.session.replacedId = parseInt(replacedId, 10);
    const approvers = await Member.getApprovers({ id: { $nin: [replacedId, ...ctx.session.excludeIds] } });
    return ctx.editMessageText(
      "Select new approver",
      Markup.inlineKeyboard(
        [...approvers.map(({ name, id }) => Markup.callbackButton(`${name}...`, `assign_user_${id}_`))],
        {
          columns: 2
        }
      ).extra()
    );
  } catch (e) {
    ctx.editMessageText("An error has occurred").catch(logger.error);
    logger.error(e);
    ctx.scene.leave(clearSession());
    return ctx.reportError(e);
  }
});

reassign.action(/(assign_user_)(\d+)/, async ctx => {
  try {
    const assignedId = ctx.match[2];
    const assignedApprover = await Member.findOne({ id: assignedId });
    const mergeRequest = await MergeRequest.findOne({ iid: ctx.session.mergeRequestIid }).populate(
      "appointed_approvers"
    );
    const replacedApprover = mergeRequest.appointed_approvers.find(({ id }) => ctx.session.replacedId === id);
    const withoutReplaced = mergeRequest.appointed_approvers.filter(({ id }) => replacedApprover.id !== id);
    await mergeRequest.reassignApprovers(...withoutReplaced.map(({ _id }) => _id), assignedApprover._id);
    const message = await Message.findByUrl(mergeRequest.web_url);
    if (message) {
      const hashTags = `\n#reassignment #for_${assignedApprover.tgUsername}`;
      const replyBody = `@${replacedApprover.tgUsername} has been replaced by @${
        assignedApprover.tgUsername
      }${hashTags}`;
      notifyGroup(message.chat.id, replyBody, message.message_id).catch(logger.error);
    }
    ctx.telegram
      .sendMessage(
        assignedApprover.tgId,
        `You has been assigned as approver for \n${mergeRequest.title}\n${mergeRequest.web_url}`
      )
      .catch(logger.error);
    ctx.telegram.sendSticker(assignedApprover.tgId, "CAADAgADQAAD-swRDX1CanhPdID-Ag").catch(logger.error);
    return ctx.editMessageText(
      `Successful reassignment <b>${replacedApprover.name}</b> -> <b>${assignedApprover.name}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (e) {
    ctx.editMessageText("An error has occurred").catch(logger.error);
    logger.error(e);
    return ctx.reportError(e);
  } finally {
    ctx.scene.leave(clearSession());
  }
});
reassign.leave(clearSession());

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
  safe,
  reassign
};
