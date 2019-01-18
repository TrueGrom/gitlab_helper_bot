const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Member = require('../schemas/member');
const User = require('../schemas/user');
const Group = require('../schemas/group');
const { getNotAttachedMembers } = require('../schemas/queries');
const { findUsername, normalizeTgUsername } = require('../helpers');
const logger = require('../logger');

async function selectMembers(ctx, prefix) {
  try {
    const members = await getNotAttachedMembers();
    if (members.length) {
      return ctx.reply('GITLAB users:', Markup.inlineKeyboard([
        ...members.map(member => Markup.callbackButton(member.username, `${prefix}_${member.username}`)),
      ],
      { columns: 3 }).extra());
    }
    return ctx.reply('All users already attached');
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
}

async function rejectAttachment(ctx) {
  try {
    const [{ username: gitlabUsername }] = await Member.find({ _id: ctx.session.attach.member });
    return ctx.replyWithMarkdown(`${ctx.session.attach.reject} *${gitlabUsername}*`);
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  } finally {
    ctx.scene.leave();
  }
}

async function attachUserManually(ctx) {
  try {
    ctx.session.attach = {};
    const tgUser = findUsername(ctx.message.text);
    if (tgUser) {
      const user = await User.findOne({ username: tgUser });
      if (user) {
        ctx.session.attach = {
          ...ctx.session.attach,
          reject: `${tgUser} is already attached to `,
          member: user.member,
        };
        return rejectAttachment(ctx);
      }
      ctx.session.attach = {
        ...ctx.session.attach,
        tgUser: normalizeTgUsername(tgUser),
        message: `${tgUser} has been attached to `,
      };
      return selectMembers(ctx, 'attach');
    }
    return ctx.scene.reenter();
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}


const attach = new Scene('attach');
attach.enter(ctx => ctx.reply('Enter a Telegram username'));
attach.leave(ctx => delete ctx.session.attach);
attach.on('message', attachUserManually);

const deactivate = new Scene('deactivate');
deactivate.enter(async (ctx) => {
  const groups = await Group.find({ active: true });
  if (groups.length) {
    return ctx.reply('Active groups:', Markup.inlineKeyboard([
      ...groups.map(group => Markup.callbackButton(group.title, `deactivate_${group.id}`)),
    ],
    { columns: 3 }).extra());
  }
  ctx.scene.leave();
  return ctx.reply('No active groups');
});


const revoke = new Scene('revoke');
revoke.enter(async (ctx) => {
  try {
    const approvers = await User.find({ approver: true });
    if (approvers.length) {
      return ctx.reply('Select a developer', Markup.inlineKeyboard([
        ...approvers.map(user => Markup.callbackButton(user.username, `revoke_${user.username}`)),
      ],
      { columns: 3 }).extra());
    }
    return ctx.reply('No approvers');
  } catch (e) {
    logger.error(e);
    ctx.scene.leave();
    return ctx.reportError(e);
  }
});

module.exports = {
  attach,
  deactivate,
  revoke,
};
