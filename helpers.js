const { ADMIN_ID } = require('./constants');

function findUsername(text) {
  const match = text.match(/(?:@)(\w+\b)/);
  return match ? match[0] : null;
}

function normalizeTgUsername(username) {
  return username.replace('@', '');
}


function checkAdmin(ctx, callback) {
  if (ctx.from.id === ADMIN_ID) {
    return callback(ctx);
  }
  return ctx.reply('No access');
}

function checkPrivate(ctx, callback) {
  if (ctx.isPrivateChat()) {
    return callback(ctx);
  }
  return ctx.reply('');
}

function checkAdminAndGroup(ctx, callback) {
  if (ctx.isGroupChat() && ctx.from.id === ADMIN_ID) {
    return callback(ctx);
  }
  return ctx.reply('');
}

function checkGroup(ctx, callback) {
  if (ctx.isGroupChat()) {
    return callback(ctx);
  }
  return ctx.reply('');
}

function checkPrivateAdmin(ctx, callback) {
  return checkPrivate(ctx, () => checkAdmin(ctx, callback));
}

function compareMergeRequest(userA, userB) {
  if (userA.mergeRequests.length < userB.mergeRequests.length) {
    return -1;
  }
  if (userA.mergeRequests.length > userB.mergeRequests.length) {
    return 1;
  }
  return 0;
}

module.exports = {
  findUsername,
  checkAdmin,
  checkPrivate,
  checkPrivateAdmin,
  checkAdminAndGroup,
  checkGroup,
  normalizeTgUsername,
  compareMergeRequest,
};
