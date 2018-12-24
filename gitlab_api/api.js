const Gitlab = require('gitlab/dist/es5').default;
const constants = require('../constants');

const api = new Gitlab({
  token: constants.GITLAB_TOKEN,
});

module.exports = api;
