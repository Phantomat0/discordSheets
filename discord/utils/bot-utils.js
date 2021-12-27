const { ThumbsUp } = require("./icons");
const { MessageEmbed } = require("discord.js");
const { SIGNUP_ID, SIGNUP_LIST_MESSAGE_ID } = require("../config/channels");
const mainDatabase = require("../../database/main/main");
const CacheManager = require("../../database/main/cachemanager");

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

  const PlayersManager = await new CacheManager(mainDatabase).loadCache(
    "players",
    mainDatabase.getPlayers
  );

  const mapToSignUpList = (playerArray) => {
    return playerArray.map((signUpObj) => {
      const { player_id, player_display_name, position } = signUpObj;
      const { discord_id, player_name } = PlayersManager.getPlayer(player_id);
      return `${player_name} <@${discord_id}>  \`${position}\``;
    });
  };

  // Map each player to
  const freeAgentPlayersMapped = mapToSignUpList(freeAgentPlayers);
  const waiverPlayersMapped = mapToSignUpList(waiverPlayers);

  const signedUpPlayersEmbed = new MessageEmbed()
    .setTitle("Draft Signups")
    .setColor("#FF0055")
    .setDescription(
      `**Waivers: ${waiverPlayersMapped.length}**\n${waiverPlayersMapped.join(
        "\n"
      )}\n\n**Free Agents: ${
        freeAgentPlayersMapped.length
      }**\n${freeAgentPlayersMapped.join("\n")}`
    );

  await client.channels.cache
    .get(SIGNUP_ID)
    .messages.fetch(SIGNUP_LIST_MESSAGE_ID)
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

async function validateMute(interaction, discordMember) {
  // These roles cannot be muted
  const SAFE_ROLES = ["Admin", "Moderator", "Bot"];

  // Cant mute yourself
  if (interaction.user.id === discordMember.user.id)
    throw new CommandError("Invalid User", "You cannot mute yourself");

  // Cant mute invalid user
  if (!discordMember)
    throw new CommandError(
      "Invalid User",
      "User does not exist in this Discord"
    );

  // Mute a Moderator or Admin
  const attemptToMuteSafeRole = discordMember.roles.cache.some((role) =>
    SAFE_ROLES.includes(role.name)
  );

  if (attemptToMuteSafeRole)
    throw new CommandError("Invalid Mute", "User cannot be muted");
}

module.exports = {
  updateSignUpList,
  sendMessageIfValidUser,
  getDiscordMember,
  sendInteractionCompleted,
  sendInteractionTimedOut,
  addDiscordRole,
  removeDiscordRole,
  validateMute,
};
