const { DEFAULT_PROJECT } = require('../constants');
const MergeRequest = require('../schemas/merge_request');
const { getAllMergeRequests } = require('../gitlab_api/merge_requests');
const { checkNewMergeRequests } = require('./open_mr');
const logger = require('../logger');

async function updateMergeRequests() {
  try {
    const mergeRequests = await getAllMergeRequests(DEFAULT_PROJECT);
    const bulkOperations = mergeRequests.map(mergeRequest => ({
      updateOne: {
        filter: { id: mergeRequest.id, iid: mergeRequest.iid },
        update: {
          ...mergeRequest,
        },
        upsert: true,
      },
    }));
    await MergeRequest.bulkWrite(bulkOperations);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

updateMergeRequests()
  .then(() => {
    logger.info('Updated');
    return checkNewMergeRequests();
  })
  .then(() => process.exit(0))
  .catch(e => logger.error(e));
