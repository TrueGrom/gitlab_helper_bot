const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const express = require('express')();
const {
  TELEGRAM_TOKEN, EXPRESS_PATH, SECRET_LOCATION, SECRET_PATH, BOT_PORT, ADMIN_ID,
} = require('./constants');
const commands = require('./bot_handlers/commands');
const scenes = require('./bot_handlers/scenes');
const actions = require('./bot_handlers/actions');
const {
  checkPrivate, checkPrivateAdmin, checkAdminAndGroup, checkGroup,
} = require('./helpers');
const logger = require('./logger');


const bot = new Telegraf(TELEGRAM_TOKEN);
const stage = new Stage();
stage.command('cancel', Stage.leave());
stage.register(scenes.attach);
stage.register(scenes.attachMe);

bot.use(session());
bot.use(stage.middleware());
express.use(bot.webhookCallback(EXPRESS_PATH));
bot.catch(err => logger.error(err));
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
});

bot.context.isGroupChat = function () {
  return this.chat.type === 'group';
};

bot.context.isPrivateChat = function () {
  return this.chat.type === 'private';
};

bot.context.getBotUsername = function () {
  return bot.options.username;
};

bot.context.isStartCommand = function () {
  return this.message ? this.message.text === `/start@${bot.options.username}` : false;
};

bot.context.isAdmin = function () {
  return this.from.id === ADMIN_ID;
};


express.listen(BOT_PORT, () => {
  logger.info(`listening on port ${BOT_PORT}`);
});

bot.start(commands.start);
bot.command('attach', context => checkPrivateAdmin(context, ctx => ctx.scene.enter('attach')));
bot.command('access_me', context => checkGroup(context, ctx => commands.accessMe(ctx)));
bot.command('attach_me', context => checkPrivate(context, ctx => ctx.scene.enter('attach_me')));
bot.command('detach_me', context => checkPrivate(context, ctx => commands.detachMe(ctx)));
bot.command('enable_notifications', context => checkPrivate(context, commands.enableNotifications));
bot.command('disable_notifications', context => checkPrivate(context, commands.disableNotifications));
bot.command('activate', context => checkAdminAndGroup(context, ctx => commands.activateChat(ctx)));
bot.command('deactivate', context => checkAdminAndGroup(context, ctx => commands.deactivateChat(ctx)));

bot.action(/(attach)_([\w+.]+)/, actions.attachUser);
bot.action(/(attachme)_([\w+.]+)/, actions.attachUser);

bot.telegram.setWebhook(SECRET_LOCATION + SECRET_PATH);
