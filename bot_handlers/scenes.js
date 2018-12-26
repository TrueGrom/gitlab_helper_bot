const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Member = require('../schemas/member');
const User = require('../schemas/user');
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
    return ctx.reply('Error');
  }
}

async function attachSelf(ctx) {
  try {
    ctx.session.attach = {};
    const user = await User.findOne({ username: ctx.chat.username });
    if (user) {
      ctx.session.attach = { ...ctx.session.attach, reject: 'You are already attached to', member: user.member };
      return rejectAttachment(ctx);
    }
    ctx.session.attach = { ...ctx.session.attach, tgUser: ctx.chat.username, message: 'You has been attached to' };
    return selectMembers(ctx, 'attachme');
  } catch (e) {
    logger.error(e);
    return ctx.reply('Error');
  }
}

const attach = new Scene('attach');
attach.enter(ctx => ctx.reply('Enter a Telegram username'));
attach.leave(ctx => delete ctx.session.attach);
attach.on('message', attachUserManually);

const attachMe = new Scene('attach_me');
attachMe.leave(ctx => delete ctx.session.attach);
attachMe.enter(attachSelf);


module.exports = {
  attach,
  attachMe,
};
