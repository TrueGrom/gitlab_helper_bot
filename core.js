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
  checkPrivate, checkPrivateAdmin, checkAdminAndGroup,
} = require('./helpers');
const logger = require('./logger');


const bot = new Telegraf(TELEGRAM_TOKEN);
const stage = new Stage();
stage.command('cancel', Stage.leave());
stage.register(scenes.attach);
stage.register(scenes.deactivate);
stage.register(scenes.revoke);
stage.register(scenes.grant);

bot.use(session());
bot.use(stage.middleware());
express.use(bot.webhookCallback(EXPRESS_PATH));
bot.catch(err => logger.error(err));
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
});

bot.context.isGroupChat = function () {
  return this.chat.type === 'group' || this.chat.type === 'supergroup';
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

bot.context.reportError = function (error) {
  return bot.telegram.sendMessage(ADMIN_ID, error);
};

express.listen(BOT_PORT, () => {
  logger.info(`listening on port ${BOT_PORT}`);
});

bot.command('attach', context => checkPrivateAdmin(context, ctx => ctx.scene.enter('attach')));
bot.command('deactivate', context => checkPrivateAdmin(context, ctx => ctx.scene.enter('deactivate')));
bot.command('revoke', context => checkPrivateAdmin(context, ctx => ctx.scene.enter('revoke')));
bot.command('grant', context => checkPrivateAdmin(context, ctx => ctx.scene.enter('grant')));

bot.command('enable_notifications', context => checkPrivate(context, commands.enableNotifications));
bot.command('disable_notifications', context => checkPrivate(context, commands.disableNotifications));

bot.command('activate', context => checkAdminAndGroup(context, ctx => commands.activateChat(ctx)));

bot.action(/(attach)_([\w+.]+)/, actions.attachUser);
bot.action(/(deactivate)_(-\d+)/, actions.deactivateChat);
bot.action(/(revoke)_(\w+)/, actions.revokeApprover);
bot.action(/(grant)_(\w+)/, actions.grantApprover);

bot.telegram.setWebhook(SECRET_LOCATION + SECRET_PATH);
