const Telegraf = require("telegraf");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const express = require("express")();

const { extendBot, onlyAdmin, onlyPrivate, onlyGroup } = require("./decorators");
const { TELEGRAM_TOKEN, EXPRESS_PATH, SECRET_LOCATION, SECRET_PATH, BOT_PORT } = require("./settings");
const { GITLAB_USERNAME_PATTERN } = require("./constants");
const commands = require("./bot_handlers/commands");
const scenes = require("./bot_handlers/scenes");
const actions = require("./bot_handlers/actions");
const logger = require("./logger");

const bot = new Telegraf(TELEGRAM_TOKEN);
extendBot(bot);

const stage = new Stage();
stage.command("cancel", Stage.leave());
stage.register(scenes.attach);
stage.register(scenes.deactivate);
stage.register(scenes.revoke);
stage.register(scenes.grant);

bot.use(session());
bot.use(stage.middleware());
express.use(bot.webhookCallback(EXPRESS_PATH));
bot.catch(err => logger.error(err));
bot.telegram.getMe().then(botInfo => {
  bot.options.username = botInfo.username;
});

express.listen(BOT_PORT, () => {
  logger.info(`listening on port ${BOT_PORT}`);
});

bot.command("attach", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("attach"))));
bot.command("deactivate", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("deactivate"))));
bot.command("revoke", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("revoke"))));
bot.command("grant", onlyAdmin(onlyPrivate(ctx => ctx.scene.enter("grant"))));

bot.command("activate", onlyAdmin(onlyGroup(ctx => commands.activateChat(ctx))));

bot.action(new RegExp(`(attach)_(${GITLAB_USERNAME_PATTERN.source})`), actions.attachUser);
bot.action(new RegExp(`(revoke)_(${GITLAB_USERNAME_PATTERN.source})`), actions.revokeApprover);
bot.action(new RegExp(`(grant)_(${GITLAB_USERNAME_PATTERN.source})`), actions.grantApprover);
bot.action(/(deactivate)_(-\d+)/, actions.deactivateChat);

bot.telegram.setWebhook(SECRET_LOCATION + SECRET_PATH);
