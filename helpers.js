function getManagers(members) {
  return members.filter(({ productManager }) => productManager);
}

function getTesters(members) {
  return members.filter(({ tester }) => tester);
}

function getUsernames(users) {
  return users.map(({ tgUsername }) => tgUsername);
}

module.exports = {
  getManagers,
  getTesters,
  getUsernames
};
