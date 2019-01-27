const { ADMIN_ID } = require("./settings");
const { TELEGRAM_USERNAME_PATTERN } = require("./constants");

function extendBot(bot) {
  bot.context.isGroupChat = function() {
    return this.chat.type === "group" || this.chat.type === "supergroup";
  };

  bot.context.isPrivateChat = function() {
    return this.chat.type === "private";
  };

  bot.context.getBotUsername = function() {
    return bot.options.username;
  };

  bot.context.isStartCommand = function() {
    return this.message ? this.message.text === `/start@${bot.options.username}` : false;
  };

  bot.context.isAdmin = function() {
    return this.from.id === ADMIN_ID;
  };

  bot.context.reportError = function(error) {
    return bot.telegram.sendMessage(ADMIN_ID, error);
  };

  bot.context.findUsername = function() {
    const match = this.message.text.match(TELEGRAM_USERNAME_PATTERN);
    return match ? match[0] : null;
  };
}

function onlyPrivate(func) {
  return function(ctx) {
    if (ctx.isPrivateChat()) {
      return func(ctx);
    }
  };
}

function onlyAdmin(func) {
  return function(ctx) {
    if (ctx.isAdmin()) {
      return func(ctx);
    }
  };
}

function onlyGroup(func) {
  return function(ctx) {
    if (ctx.isGroupChat()) {
      return func(ctx);
    }
  };
}

module.exports = {
  extendBot,
  onlyPrivate,
  onlyAdmin,
  onlyGroup
};
