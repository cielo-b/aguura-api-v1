const { CronJob } = require("cron");
const { Token } = require("../models");

const clearTokens = new CronJob("0 0 * * *", async () => {
  try {
    // Find tokens that have expired
    const expiredTokens = await Token.find({ expires: { $lte: new Date() } });

    // Delete expired tokens
    await Token.deleteMany({
      _id: { $in: expiredTokens.map((token) => token._id) },
    });

    console.log(`${expiredTokens.length} expired tokens deleted.`);
  } catch (error) {
    console.error("Error deleting expired tokens:", error);
  }
});

module.exports = clearTokens;
