const { ADMIN_ID, DEFAULT_MESSAGE } = require('./constants');
const Group = require('./schemas/group');
const logger = require('./logger');
const { getAllUsersFromGroups } = require('./schemas/queries');

function access() {
  return async (ctx, next) => {
    try {
      if (ctx.from.id === ADMIN_ID) {
        return next(ctx);
      }
      if (ctx.isStartCommand()) {
        return next(ctx);
      }
      const allGroups = await Group.find({ active: true });
      if (allGroups && getAllUsersFromGroups(allGroups).includes(ctx.from.id)) {
        return next(ctx);
      }
      return ctx.isGroupChat() ? ctx.reply('') : ctx.reply(DEFAULT_MESSAGE);
    } catch (e) {
      logger.error(e);
      return ctx.reply('Error');
    }
  };
}

module.exports = {
  access,
};
