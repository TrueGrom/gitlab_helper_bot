const _ = require("lodash");

const api = require("../api");
const logger = require("../logger");
const Project = require("../models/project");
const Member = require("../models/member");

async function updateDatabase() {
  const membersIds = _.keyBy(await Member.find({}, { id: 1 }), "id");
  const [project, members] = await Promise.all([api.getProject(), api.getProjectMembers()]);
  const updateMembersOperations = members
    .filter(({ id }) => membersIds[id])
    .map(member => ({
      updateOne: {
        filter: { id: member.id },
        update: {
          ...member
        },
        upsert: true
      }
    }));
  const newMembers = members.filter(({ id }) => !membersIds[id]);
  return Promise.all([
    Member.bulkWrite(updateMembersOperations),
    Member.insertMany(newMembers),
    Project.updateOne({ id: project.id }, { $set: { ...project } })
  ]);
}

module.exports = updateDatabase;

updateDatabase()
  .then(() => {
    logger.info("Database has been updated");
    process.exit(0);
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });
