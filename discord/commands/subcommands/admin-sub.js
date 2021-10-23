const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../../../database/main/main");
const {
  updateSignUpList,
  getTeamManagerIDs,
  getManagerAndTeamFromInteractionUser,
  getTeamByDivisionOption,
  getDiscordMember,
  sendInteractionCompleted,
  sendInteractionTimedOut,
} = require("../../bot-util");
const { getCancelAndConfirmButtonRow } = require("../../buttons");
const { successEmbedCreator } = require("../../embeds");
const { CommandError } = require("../../errors");
const { TRANSACTIONS_ID } = require("../../config/channels");
const {
  GENERAL_MANAGER_ROLE_ID,
  ASSISTANT_MANAGER_ROLE_ID,
} = require("../../config/roles");

async function signCmd(interaction) {}

async function releaseCmd(interaction) {}

async function appointManagerCmd(interaction) {
  const { options } = interaction;
  const teamIDOption = options.getString("team");
  const positionOption = options.getString("position");
  const playerNameOption = options.getString("player_name");

  console.log(teamIDOption);

  const teamProfile = await mainDatabase.getTeam(teamIDOption);

  console.log(teamProfile, "teamProfile");
  const { generalManagerID, assistantManagerIDs } =
    getTeamManagerIDs(teamProfile);

  // Check if the player is valid

  const selectedPlayerProfile = await mainDatabase.getPlayerByName(
    playerNameOption
  );

  if (selectedPlayerProfile === null)
    throw new CommandError(
      "Player does not exist",
      `Player **${playerNameOption}** does not exist`
    );

  // You can only appoint players who are not on a team or are on your team

  const NO_TEAM_ID = 0;

  const isOnATeam = selectedPlayerProfile.current_team_id != NO_TEAM_ID;

  const teamPlayers = await mainDatabase.getPlayersByTeam(teamProfile.team_id);
  const teamAffiliate = await mainDatabase.getTeamsAffiliate(
    teamProfile.team_id
  );
  const teamAffiliatePlayers = await mainDatabase.getPlayersByTeam(
    teamAffiliate.team_id
  );

  const organizationPlayers = [...teamPlayers, ...teamAffiliatePlayers];

  const isOnTeamHeWantsToBeAppointed = organizationPlayers.some(
    (player) => player.player_id == selectedPlayerProfile.player_id
  );

  // Check if the player already is a manager

  const isAManager = await mainDatabase.getManagersTeam(
    selectedPlayerProfile.player_id,
    false
  );

  console.log(isAManager);

  if (isAManager)
    throw new CommandError(
      `Invalid Manager`,
      `**${selectedPlayerProfile.player_name}** is already a manager of a team.`
    );
  // If hes on a team and that team is not the team is being appointed a manager of
  if (isOnATeam && !isOnTeamHeWantsToBeAppointed)
    throw new CommandError(
      `Invalid Manager`,
      `**${selectedPlayerProfile.player_name}** is on another team and cannot be appointed a manager`
    );

  // Now lets make sure they arent above the AGM limit
  const AGM_COUNT_LIMIT = 2;
  if (assistantManagerIDs.length >= AGM_COUNT_LIMIT)
    throw new CommandError(
      "Invalid appointment",
      `Team **${teamProfile.name}** has reached the limit of assigneable assistant managers at **${AGM_COUNT_LIMIT}**. Demote a manager to appoint a new one.`
    );

  const getNewTeamManagerArray = () => {
    if (positionOption === "am") {
      // Dont let them appoint an assistantmanager if there is no GM
      if (generalManagerID === null)
        throw new CommandError(
          "Invalid appointment",
          `Team **${teamProfile.name}** does not have a General Manager. Please appoint a General Manager first before appointing assistant managers.`
        );

      const managerArray = [
        generalManagerID,
        ...assistantManagerIDs,
        parseInt(selectedPlayerProfile.player_id),
      ];

      return managerArray;
    }

    if (positionOption === "gm") {
      const managerArray = [
        parseInt(selectedPlayerProfile.player_id),
        generalManagerID,
        ...assistantManagerIDs,
      ];

      // Now filter out null, since generalManagerID can be null if there is no GM
      return managerArray.filter((val) => !!val);
    }
  };

  const newManagerArray = getNewTeamManagerArray();

  const gmOrAssistantStr =
    positionOption === "gm" ? "the General Manager" : "an Assistant Manager";

  const gmOrAssistantStrOther =
    positionOption === "gm" ? "General Manager" : "Assistant Manager";

  const isAppointingGM = positionOption === "gm";
  const gmSpotIsVacant = generalManagerID === null;

  const confirmEmbed = new MessageEmbed()
    .setColor("#000000")
    .setTitle(`Confirm ${gmOrAssistantStrOther} appointment`)
    .setThumbnail(teamProfile.logo_url)
    .setDescription(`Are you sure you want to appoint **${selectedPlayerProfile.player_name}** ${gmOrAssistantStr} of **${teamProfile.name}**?
      Discord: <@${selectedPlayerProfile.discord_id}>
      `);

  if (isAppointingGM && !gmSpotIsVacant) {
    // Make it aware that the current GM will be demoted to AGM if there is a GM already

    const currentGM = await mainDatabase.getPlayer(generalManagerID);

    confirmEmbed.addField(
      "Note",
      `**${currentGM.player_name}** will be demoted to an Assistant Manager as a result of this appointment.`
    );
  }

  const buttons = getCancelAndConfirmButtonRow("appointConfirm");

  interaction.editReply({
    embeds: [confirmEmbed],
    components: [buttons],
  });

  const filter = (i) =>
    i.user.id === interaction.user.id && i.customId === "appointConfirm";

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    componentType: "BUTTON",
    time: 15000,
    max: 1,
  });

  collector.on("collect", async (i) => {
    const successEmbed = successEmbedCreator(
      "Succesful manager appointment!",
      `**${selectedPlayerProfile.player_name}** is now ${gmOrAssistantStr} of **${teamProfile.name}**`
    );

    const discordMember = await getDiscordMember(
      interaction,
      selectedPlayerProfile.discord_id
    );

    if (discordMember) {
      const gmRoleOrAm =
        positionOption === "gm"
          ? GENERAL_MANAGER_ROLE_ID
          : ASSISTANT_MANAGER_ROLE_ID;
      discordMember.roles.add(gmRoleOrAm);

      if (isAppointingGM && !gmSpotIsVacant) {
        // If we are appointing a new GM, and there was a previous GM, remove that GMs GM role and add assistant role
        const currentGMProfile = await mainDatabase.getPlayer(generalManagerID);

        const currentGMDiscordMember = await getDiscordMember(
          interaction,
          currentGMProfile.discord_id
        );

        console.log(currentGMDiscordMember, "currentGM");

        if (currentGMDiscordMember) {
          currentGMDiscordMember.roles.remove(GENERAL_MANAGER_ROLE_ID);
          currentGMDiscordMember.roles.add(ASSISTANT_MANAGER_ROLE_ID);
        }
      }
    }

    const appointEmbed = new MessageEmbed()
      .setColor(teamProfile.color)
      .setAuthor(
        `The ${teamProfile.name} have appointed ${selectedPlayerProfile.player_name} as ${gmOrAssistantStr}`,
        teamProfile.logo_url
      )
      .setDescription(`<@${selectedPlayerProfile.discord_id}>`)
      .setTimestamp()
      .setFooter(
        `${interaction.user.username}`,
        interaction.user.displayAvatarURL()
      );

    await interaction.client.channels.cache.get(TRANSACTIONS_ID).send({
      embeds: [appointEmbed],
    });

    // Send to transactions channel
    mainDatabase.updateTeamsManagers(teamProfile.team_id, newManagerArray);

    i.reply({
      embeds: [successEmbed],
      ephemeral: true,
    });

    sendInteractionCompleted(interaction);
  });

  collector.on("end", (collected) => {
    if (collected.size >= 1) return;
    sendInteractionTimedOut(interaction);
  });
}

async function waiverSignCmd(interaction) {}

function updateEmbedsCmd(interaction) {
  updateSignUpList(interaction.client);

  const successEmbed = successEmbedCreator("Up to date!", "Embeds updated!");

  interaction.editReply({
    embeds: [successEmbed],
  });
}

module.exports = new Map([
  ["sign", signCmd],
  ["release", releaseCmd],
  ["appoint", appointManagerCmd],
  ["waiversign", waiverSignCmd],
  ["updateembeds", updateEmbedsCmd],
]);
