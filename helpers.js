const { ADMIN_ID } = require('./constants');
const User = require('./schemas/user');

function findUsername(text) {
  const match = text.match(/(?:@)(\w+\b)/);
  return match ? match[0] : null;
}

function normalizeTgUsername(username) {
  return username.replace('@', '');
}


function checkAdmin(ctx, callback) {
  if (ctx.isAdmin()) {
    return callback(ctx);
  }
}

function checkPrivate(ctx, callback) {
  if (ctx.isPrivateChat()) {
    return callback(ctx);
  }
}

function checkAdminAndGroup(ctx, callback) {
  if (ctx.isGroupChat() && ctx.from.id === ADMIN_ID) {
    return callback(ctx);
  }
}

function checkGroup(ctx, callback) {
  if (ctx.isGroupChat()) {
    return callback(ctx);
  }
}

function checkPrivateAdmin(ctx, callback) {
  return checkPrivate(ctx, () => checkAdmin(ctx, callback));
}

function checkExistentUser(ctx, callback) {
  const user = User.findOne({ id: ctx.from.id });
  if (user) {
    return callback(ctx);
  }
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
  checkExistentUser,
  checkPrivate,
  checkPrivateAdmin,
  checkAdminAndGroup,
  checkGroup,
  normalizeTgUsername,
  compareMergeRequest,
};
