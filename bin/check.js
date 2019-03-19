const _ = require("lodash");

const api = require("../api");
const MergeRequest = require("../models/merge-request");
const logger = require("../logger");
const { checkNewMergeRequests } = require("../utils/assign-merge-requests");
const { sendNotifications } = require("../utils/send-notifications");
const { getMetaUpdates } = require("../utils/updates");
const { handleApprovals } = require("../utils/approvals");
const { reportProblems } = require("../utils/merging-problems");

async function updateMergeRequests() {
  const mergeRequestIds = _.keyBy(await MergeRequest.find({}, { iid: 1 }), "iid");
  const mergeRequests = await api.getAllMergeRequests();
  const updateBulkOperations = mergeRequests
    .filter(({ iid }) => mergeRequestIds[iid])
    .map(mergeRequest => ({
      updateOne: {
        filter: { id: mergeRequest.id, iid: mergeRequest.iid },
        update: {
          ...mergeRequest
        }
      }
    }));
  const newMergeRequest = mergeRequests.filter(({ iid }) => !mergeRequestIds[iid]);
  await MergeRequest.bulkWrite(updateBulkOperations);
  await MergeRequest.insertMany(newMergeRequest);
}

updateMergeRequests()
  .then(checkNewMergeRequests)
  .then(getMetaUpdates)
  .then(handleApprovals)
  .then(sendNotifications)
  .then(reportProblems)
  .then(() => {
    logger.info("updated");
    process.exit(0);
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });
