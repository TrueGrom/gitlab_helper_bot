const User = require('./user');
const Member = require('./member');
const Group = require('./group');
const MergeRequest = require('./merge_request');

async function getNotAttachedMembers() {
  const users = await User.find({}, { member: 1 });
  return Member.find({ state: 'active', _id: { $nin: users.map(user => user.member) } });
}

async function getGroupByProject(project) {
  return Group
    .aggregate()
    .match({ active: true })
    .lookup({
      from: 'projects', localField: 'project', foreignField: '_id', as: 'project',
    })
    .match({ 'project.path_with_namespace': { $eq: project } });
}

async function getNewMergeRequests(users) {
  const members = users.map(user => user.member.id);
  const onApproval = Array.prototype.concat.apply([], users.map(user => user.mergeRequests));
  return MergeRequest.find({
    state: 'opened',
    _id: {
      $nin: onApproval,
    },
    'author.id': {
      $in: members,
    },
  });
}

async function getActiveApprovers() {
  return User.find({ active: true, approver: true }).populate('member');
}

function getAllUsersFromGroups(groups) {
  return Array.prototype.concat.apply([], groups.map(group => group.users));
}

module.exports = {
  getNotAttachedMembers,
  getGroupByProject,
  getNewMergeRequests,
  getActiveApprovers,
  getAllUsersFromGroups,
};
