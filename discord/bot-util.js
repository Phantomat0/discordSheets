const mainDatabase = require("../database/main/main");
const { ThumbsUp } = require("./icons");
const { MessageEmbed } = require("discord.js");
const { InvalidPermissionError } = require("./errors");
const {
  REGISTERED_LIST_ID,
  REGISTERED_LIST_MESSAGE_ID,
} = require("./config/channels");

const plural = (number, singular, plural) => {
  return `${number} ${number === 1 ? singular : plural}`;
};

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

const getTeamByDivisionOption = async (divisionOption, teamProfile) => {
  if (teamProfile.division_id == 2 && divisionOption === "division_1")
    throw new InvalidPermissionError(
      `You are not a manager of a division one team`
    );

  return divisionOption === "division_1" || teamProfile.division_id == 2
    ? teamProfile
    : await mainDatabase.getTeamsAffiliate(teamProfile.team_id);
};

const getManagerAndTeamFromInteractionUser = async (interactionUserID) => {
  const managerProfile = await mainDatabase.getPlayerByDiscordID(
    interactionUserID
  );

  if (managerProfile === null)
    throw new InvalidPermissionError(
      `You are not registered as a player in the database`
    );

  const managerTeamProfile = await mainDatabase.getManagersTeam(
    managerProfile.player_id
  );

  if (managerTeamProfile === null)
    throw new InvalidPermissionError(
      `That team does not exist or you are not a manager of it`
    );

  return {
    managerProfile,
    managerTeamProfile,
  };
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

function getTeamManagerIDs(teamProfile) {
  const { manager_player_ids } = teamProfile;
  const managersArray = JSON.parse(manager_player_ids);

  const [generalManagerID = null, ...assistantManagerIDs] = managersArray;

  return {
    generalManagerID,
    assistantManagerIDs: assistantManagerIDs ?? [],
  };
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
      // return `${player_display_name} <@${discord_id}> \`${availability}\` \`${position}\``;
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
      }**\n${freeAgentPlayersMapped.join("\n")}]`
    );

  await client.channels.cache
    .get(REGISTERED_LIST_ID)
    .messages.fetch(REGISTERED_LIST_MESSAGE_ID)
    .then((message) => message.edit({ embeds: [signedUpPlayersEmbed] }));
}

const validateCommandRolesAndChannels = (
  interaction,
  allowedRoles,
  allowedChannels
) => {
  if (allowedRoles.length !== 0) {
    const hasPerms = interaction.member.roles.cache.some((role) =>
      allowedRoles.includes(role.name)
    );

    if (!hasPerms)
      throw new InvalidPermissionError(
        `You are not authorized to use that command!`
      );
  }

  if (allowedChannels.length !== 0) {
    if (!allowedChannels.includes(interaction.channelId))
      throw new InvalidPermissionError(
        `This command is not available in this channel`
      );
  }
};

const getDateTimeString = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  });
};

const getDiscordMember = async (interaction, discordID) => {
  try {
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
  validateCommandRolesAndChannels,
  getTeamManagerIDs,
  getManagerAndTeamFromInteractionUser,
  sendMessageIfValidUser,
  getTeamByDivisionOption,
  getDateTimeString,
  getDiscordMember,
  sendInteractionCompleted,
  sendInteractionTimedOut,
  addDiscordRole,
  removeDiscordRole,
  plural,
};
