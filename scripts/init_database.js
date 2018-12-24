const { DEFAULT_PROJECT } = require('../constants');
const logger = require('../logger');
const api = require('../gitlab_api/api');
const { getAllMergeRequests } = require('../gitlab_api/merge_requests');
const Project = require('../schemas/project');
const MergeRequest = require('../schemas/merge_request');
const Member = require('../schemas/member');

async function fill() {
  try {
    const requests = Promise.all([
      api.Projects.show(DEFAULT_PROJECT),
      api.ProjectMembers.all(DEFAULT_PROJECT, { state: 'active' }),
      getAllMergeRequests(DEFAULT_PROJECT),
    ]);
    const [project, members, mergeRequests] = await requests;
    await Promise.all([
      Project.create(project),
      MergeRequest.insertMany(mergeRequests),
      Member.insertMany(members),
    ]);
  } catch (e) {
    logger.error(e);
  }
}

fill()
  .then(() => {
    logger.info('Complete');
    process.exit(0);
  })
  .catch(e => logger.error(e));
