const Member = require("../models/member");
const Message = require("../models/message");
const MergeRequest = require("../models/merge-request");
const Group = require("../models/group");
const logger = require("../logger");
const { makeReportMessage } = require("../utils/messages");

async function attachUser(ctx) {
  try {
    const member = await Member.findOne({ username: ctx.match[2] });
    const { tgUsername } = ctx.session;
    await member.setTelegramInfo({ username: tgUsername });
    logger.info(`${tgUsername} attached to ${member.username}`);
    return ctx.editMessageText(`${tgUsername} has been attached to <b>${member.username}</b>`, { parse_mode: "HTML" });
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText("Something went wrong");
  } finally {
    ctx.scene.leave();
  }
}

async function deactivateChat(ctx) {
  try {
    await Group.updateOne({ id: ctx.match[2] }, { $set: { active: false } });
    logger.warn(`Chat ${ctx.chat.id} has been deactivated`);
    return ctx.editMessageText("This chat has been deactivated");
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  }
}

async function revokeApprover(ctx) {
  try {
    await Member.revokeApprover({ username: ctx.match[2] });
    return ctx.editMessageText(`Approver has been revoked from ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function grantApprover(ctx) {
  try {
    await Member.grantApprover({ username: ctx.match[2] });
    return ctx.editMessageText(`Approver has been granted to ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function grantProductManager(ctx) {
  try {
    await Member.grantProductManager({ username: ctx.match[2] });
    return ctx.editMessageText(`Product manager has been granted to ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function revokeProductManager(ctx) {
  try {
    await Member.revokeProductManager({ username: ctx.match[2] });
    return ctx.editMessageText(`Product manager has been revoked from ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function grantTester(ctx) {
  try {
    await Member.grantTester({ username: ctx.match[2] });
    return ctx.editMessageText(`Tester has been granted to ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function revokeTester(ctx) {
  try {
    await Member.revokeTester({ username: ctx.match[2] });
    return ctx.editMessageText(`Tester has been revoked from ${ctx.match[2]}`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function markSafe(ctx) {
  try {
    await Member.markSafe({ username: ctx.match[2] });
    return ctx.editMessageText(`${ctx.match[2]} has been marked as safe`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function markUnsafe(ctx) {
  try {
    await Member.markUnsafe({ username: ctx.match[2] });
    return ctx.editMessageText(`${ctx.match[2]} has been marked as unsafe`);
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function myMergeRequests(ctx) {
  const { username } = ctx.chat;
  try {
    const member = await Member.findOne({ tgUsername: `${username}` });
    if (!member.approver) {
      return ctx.reply("You are not a approver");
    }
    const mergeRequests = await MergeRequest.getNotApprovedByMember(member);
    if (mergeRequests.length) {
      const message = mergeRequests.reduce((acc, { title, web_url }) => `${acc}${title}\n${web_url}\n\n`, "");
      return ctx.reply(message, { disable_web_page_preview: true });
    }
    return ctx.reply("Relax. No merge requests for you");
  } catch (e) {
    logger.error(e);
    ctx.reportError(e);
  }
}

async function deleteAllMessages(ctx) {
  try {
    const messages = await Message.getForDeletingByChatId(parseInt(ctx.match[2], 10));
    if (!messages.length) {
      return ctx.editMessageText("No messages for this group");
    }
    for (const message of messages) {
      try {
        await ctx.telegram.deleteMessage(message.chat.id, message.message_id);
        await message.markAsDeleted();
      } catch (e) {
        logger.error(e);
        await message.setError(e);
      }
    }
    return ctx.editMessageText("All messages has been removed");
  } catch (e) {
    logger.error(e);
    return ctx.editMessageText(e);
  } finally {
    ctx.scene.leave();
  }
}

async function getReport(ctx) {
  try {
    const openedMergeRequest = await MergeRequest.getOpened();
    if (openedMergeRequest.length) {
      await ctx.reply(makeReportMessage(openedMergeRequest), { disable_web_page_preview: true, parse_mode: "HTML" });
    } else {
      await ctx.reply("Relax. No opened merge requests");
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  attachUser,
  deactivateChat,
  revokeApprover,
  grantApprover,
  myMergeRequests,
  deleteAllMessages,
  grantProductManager,
  revokeProductManager,
  getReport,
  grantTester,
  revokeTester,
  markSafe,
  markUnsafe
};
