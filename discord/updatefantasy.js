const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../database/main/main");
const {
  FANTASY_LEADERBOARD_ID,
  FANTASY_MESSAGE_ID,
} = require("./config/channels");

async function updateFantasy(client) {
  const teamRankingsTableStr = await mainDatabase.getFantasyTeamRankingsTable();

  const playerRankingsThisWeekStr =
    await mainDatabase.getFantasyRankingsCurrentWeek();

  const playerRankingsTableStr =
    await mainDatabase.getFantasyPlayerRankingsTable();

  const playerRankingsEmbed = new MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Player Rankings")
    .setDescription(`\`\`\`css\n${playerRankingsTableStr}\`\`\``);

  const playerRankingsThisWeekEmbed = new MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Top Players This Week")
    .setDescription(`\`\`\`css\n${playerRankingsThisWeekStr}\`\`\``);

  const teamRankingsEmbed = new MessageEmbed()
    .setColor("#00FFFF")
    .setTitle("Team Rankings")
    .setDescription(`\`\`\`css\n${teamRankingsTableStr}\`\`\``);

  await client.channels.cache
    .get(FANTASY_LEADERBOARD_ID)
    .messages.fetch(FANTASY_MESSAGE_ID)
    .then((message) => {
      message.edit({
        embeds: [
          playerRankingsThisWeekEmbed,
          playerRankingsEmbed,
          teamRankingsEmbed,
        ],
      });
    });
}

module.exports = updateFantasy;
