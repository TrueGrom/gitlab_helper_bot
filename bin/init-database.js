const uniqBy = require("lodash/uniqBy");
const api = require("../api");
const logger = require("../logger");
const Project = require("../models/project");
const MergeRequest = require("../models/merge-request");
const Member = require("../models/member");

async function initDatabase() {
  const [project, members, mergeRequests] = await Promise.all([
    api.getProject(),
    api.getProjectMembers(),
    api.getAllMergeRequests()
  ]);
  return Promise.all([
    Project.create(project),
    MergeRequest.insertMany(mergeRequests),
    Member.insertMany(uniqBy(members, "id"))
  ]);
}

module.exports = initDatabase;

initDatabase()
  .then(() => {
    logger.info("Database has been initialized");
    process.exit(0);
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });
