const mainDatabase = require("../database/main/main");
const { MessageEmbed } = require("discord.js");

async function updateSignUpList(bot) {
  const CHANNEL_ID = "894663436368220180";
  const MESSAGE_ID = "894677901587394702";
  const signedUpPlayers = (await mainDatabase.getSignUps()) ?? [];
  console.log("stuff");

  const signedUpPlayersMapped = signedUpPlayers.map(async (signUpArray) => {
    const [playerID, , name, , availability] = signUpArray;
    const discordID = await mainDatabase.getDiscordByPlayerID(playerID);
    if (discordID === null) return `${name}  [${availability}]`;
    return `${name} | <@${discordID}> [${availability}]`;
  });

  const signedUpPlayersStr = await Promise.all(signedUpPlayersMapped);

  const signedUpPlayersEmbed = new MessageEmbed()
    .setTitle("Draft Signups")
    .setColor("#FF0055")
    .setDescription(
      `
          **Players: ${signedUpPlayers.length}**
          ${signedUpPlayersStr.join("\n")}
          `
    );

  await bot.channels.cache
    .get(CHANNEL_ID)
    .messages.fetch(MESSAGE_ID)
    .then((message) => message.edit({ embeds: [signedUpPlayersEmbed] }));
}

module.exports = {
  updateSignUpList,
};
