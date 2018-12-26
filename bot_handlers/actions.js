const Member = require('../schemas/member');
const User = require('../schemas/user');
const logger = require('../logger');

async function attachUser(ctx) {
  try {
    const [{ _id, username: gitlabUsername }] = await Member.find({ username: ctx.match[2] });
    const newUser = { username: ctx.session.attach.tgUser, member: _id };
    if (newUser.username === ctx.chat.username) {
      Object.assign(newUser, ctx.chat);
    }
    await User.create({ ...newUser, approver: true });
    logger.info(`@${ctx.session.attach.tgUser} attached to ${gitlabUsername}`);
    return ctx.editMessageText(`${ctx.session.attach.message} <b>${gitlabUsername}</b>`, { parse_mode: 'HTML' });
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText('Something went wrong');
  } finally {
    ctx.scene.leave();
  }
}

module.exports = {
  attachUser,
};
