const { DEFAULT_PROJECT } = require('../constants');
const User = require('../schemas/user');
const Group = require('../schemas/group');
const Project = require('../schemas/project');
const logger = require('../logger');

async function enableNotifications(ctx) {
  try {
    await User.updateOne({ username: ctx.chat.username }, { $set: { notifications: true } });
    return ctx.reply('Notifications has been enabled');
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

async function disableNotifications(ctx) {
  try {
    await User.updateOne({ username: ctx.chat.username }, { $set: { notifications: false } });
    return ctx.reply('Notifications has been disabled');
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

async function activateChat(ctx) {
  try {
    const group = await Group.findOne({ id: ctx.chat.id });
    if (group && group.active) {
      return ctx.reply('This chat already activated');
    }
    const { _id } = await Project.findOne({ path_with_namespace: DEFAULT_PROJECT });
    await Group.updateOne(
      { id: ctx.chat.id },
      {
        $set: {
          ...ctx.chat, project: _id, active: true, approversCount: 2,
        },
      },
      { upsert: true },
    );
    logger.info(`Chat ${ctx.chat.id} has been activated`);
    return ctx.reply('This chat has been activated');
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

async function deactivateChat(ctx) {
  try {
    await Group.updateOne({ id: ctx.chat.id }, { $set: { active: false } });
    logger.warn(`Chat ${ctx.chat.id} has been deactivated`);
    return ctx.reply('This chat has been deactivated');
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

module.exports = {
  enableNotifications,
  disableNotifications,
  activateChat,
  deactivateChat,
};
