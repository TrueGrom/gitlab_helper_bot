const Group = require("../models/group");
const Member = require("../models/member");
const Project = require("../models/project");
const { updateDatabase } = require("../bin/update-database");
const logger = require("../logger");
const { DEFAULT_PROJECT } = require("../settings");

async function activateChat(ctx) {
  try {
    const group = await Group.findOne({ id: ctx.chat.id });
    if (group && group.active) {
      return ctx.reply("This chat already activated");
    }
    const { _id } = await Project.findOne({ path_with_namespace: DEFAULT_PROJECT });
    await Group.updateOne(
      { id: ctx.chat.id },
      {
        $set: {
          ...ctx.chat,
          project: _id,
          active: true,
          approversCount: 2
        }
      },
      { upsert: true }
    );
    logger.info(`Chat ${ctx.chat.id} has been activated`);
    return ctx.reply("This chat has been activated");
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

async function enableNotifications(ctx) {
  try {
    const member = await Member.findOne({ tgUsername: ctx.chat.username });
    await member.setTelegramInfo(ctx.chat);
    if (member.notifications) {
      return ctx.reply("Notifications already enabled");
    }
    await member.enableNotifications();
    return ctx.reply("Notifications have been enabled");
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

async function disableNotifications(ctx) {
  try {
    const member = await Member.findOne({ tgUsername: ctx.chat.username });
    await member.setTelegramInfo(ctx.chat);
    if (!member.notifications) {
      return ctx.reply("Notifications already disabled");
    }
    await member.disableNotifications();
    return ctx.reply("Notifications have been disabled");
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  }
}

async function updateDatabaseFromChat(ctx) {
  try {
    if (ctx.session.updateProgress) {
      return ctx.reply("Update in progress");
    }
    ctx.session.updateProgress = true;
    await updateDatabase();
    return ctx.reply("Database has been updated");
  } catch (e) {
    logger.error(e);
    return ctx.reportError(e);
  } finally {
    ctx.session.updateProgress = null;
  }
}

module.exports = {
  activateChat,
  enableNotifications,
  disableNotifications,
  updateDatabaseFromChat
};
