const startCase = require("lodash/startCase");

function makeSingleReport(mergeRequest) {
  const { web_url, title, author, sha, pipelines, merge_status } = mergeRequest;
  let baseMessage = `${title}\n${web_url}\nAuthor: ${author.name}\nStatus: ${startCase(merge_status)}\n`;
  const lastPipeline = pipelines.find(pipe => sha === pipe.sha);
  if (lastPipeline) {
    baseMessage = `${baseMessage}Last pipeline: ${lastPipeline.status}\n`;
  }
  return baseMessage;
}

function makeReportMessage(openedMergeRequests) {
  const approved = openedMergeRequests.filter(({ approvalNotified }) => approvalNotified);
  const notApproved = openedMergeRequests.filter(({ approvalNotified }) => !approvalNotified);
  const approvedBody = approved.reduce((acc, mergeRequest) => `${acc}${makeSingleReport(mergeRequest)}\n`, "");
  const notApprovedBody = notApproved.reduce((acc, mergeRequest) => `${acc}${makeSingleReport(mergeRequest)}\n`, "");
  const approvedPart = `<b>Approved</b>: (${approved.length})\n${
    approved.length ? approvedBody : "No approved merge requests"
  }\n`;
  const notApprovedPart = `<b>Not Approved</b>: (${notApproved.length})\n${
    notApproved.length ? notApprovedBody : "All merge requests are approved"
  }\n`;
  return `${approvedPart}${notApprovedPart}`;
}

module.exports = {
  makeReportMessage
};
