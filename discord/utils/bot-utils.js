const { ThumbsUp } = require("./icons");
const { MessageEmbed } = require("discord.js");
const {
  REGISTERED_LIST_ID,
  REGISTERED_LIST_MESSAGE_ID,
} = require("./config/channels");

const sendInteractionCompleted = (interaction) => {
  const completeEmbed = new MessageEmbed().setTitle(
    ` ${ThumbsUp} Command Complete!`
  );
  interaction.editReply({ embeds: [completeEmbed], components: [] });
};

const sendInteractionTimedOut = (interaction) => {
  const completeEmbed = new MessageEmbed().setTitle("Command Timed Out");
  interaction.editReply({ embeds: [completeEmbed], components: [] });
};

function addDiscordRole(discordMember, roleID) {
  try {
    discordMember.roles.add(roleID);
  } catch (error) {
    console.log(error);
    return null;
  }
}

function removeDiscordRole(discordMember, roleID) {
  try {
    discordMember.roles.remove(roleID);
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function updateSignUpList(client) {
  const { freeAgentPlayers, waiverPlayers } =
    await mainDatabase.getFreeAgentsAndWaivers();

  const players = await mainDatabase.getPlayers();

  const mapToSignUpList = (playerArray) => {
    return playerArray.map((signUpObj) => {
      const { player_id, player_display_name } = signUpObj;
      const { discord_id } = players.find(
        (player) => player.player_id === player_id
      );
      return `${player_display_name} <@${discord_id}>`;
    });
  };

  // Map each player to
  const freeAgentPlayersMapped = mapToSignUpList(freeAgentPlayers);
  const waiverPlayersMapped = mapToSignUpList(waiverPlayers);

  const signedUpPlayersEmbed = new MessageEmbed()
    .setTitle("Draft Signups")
    .setColor("#FF0055")
    .setDescription(
      `**Pending Waivers: ${
        waiverPlayersMapped.length
      }**\n${waiverPlayersMapped.join("\n")}\n\n**Free Agents: ${
        freeAgentPlayersMapped.length
      }**\n${freeAgentPlayersMapped.join("\n")}`
    );

  await client.channels.cache
    .get(REGISTERED_LIST_ID)
    .messages.fetch(REGISTERED_LIST_MESSAGE_ID)
    .then((message) => message.edit({ embeds: [signedUpPlayersEmbed] }));
}

const getDiscordMember = async (interaction, discordID, guild) => {
  try {
    if (!interaction) return await guild.members.fetch(discordID);
    return await interaction.guild.members.fetch(discordID);
  } catch (error) {
    return null;
  }
};

const sendMessageIfValidUser = async (
  interaction,
  discordUserID,
  messsageObj
) => {
  try {
    const discordMember = await getDiscordMember(interaction, discordUserID);

    if (!discordMember) return;

    await discordMember.user.send(messsageObj);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  updateSignUpList,
  sendMessageIfValidUser,
  getDiscordMember,
  sendInteractionCompleted,
  sendInteractionTimedOut,
  addDiscordRole,
  removeDiscordRole,
};
