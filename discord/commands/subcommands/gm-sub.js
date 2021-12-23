const {
  updateSignUpList,
  getDiscordMember,
  sendMessageIfValidUser,
  sendInteractionCompleted,
  sendInteractionTimedOut,
} = require("../../utils/bot-utils");

const { getDateTimeString } = require("../../utils/utils");
const {
  getTeamManagerIDs,
  getManagerAndTeamFromInteractionUser,
  getTeamByDivisionOption,
  hasManagerPermsOfTeam,
  getDivisionPermsIntOfTeam,
  validateRosterSize,
} = require("../../utils/database-utils");

const mainDatabase = require("../../../database/main/main");
const { LOGO_URL } = require("../../config/logo");
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
  CachedManager,
} = require("discord.js");
const { FREE_AGENT_ROLE_ID } = require("../../config/roles");
const { TRANSACTIONS_ID } = require("../../config/channels");
const { CommandError, InvalidPermissionError } = require("../../utils/errors");
const { getCancelAndConfirmButtonRow } = require("../../utils/buttons");
const { successEmbedCreator } = require("../../utils/embeds");
const updateTeamRosters = require("../../updaterosters");

const getTeamPlayersBasedOnManagerStatus = async (
  managerTeamProfile,
  teamProfile,
  playerID
) => {
  const { generalManagerID, assistantManagerIDs } =
    getTeamManagerIDs(teamProfile);

  const teamPlayers = await mainDatabase.getPlayersByTeam(teamProfile.team_id);

  // If the player making the command is a General Manager, he can cut anyone besides himself, if hes an AGM, he may only cut players below his rank

  const isManagerFromHigherAffiliate =
    getDivisionPermsIntOfTeam(managerTeamProfile) >
    getDivisionPermsIntOfTeam(teamProfile);

  console.log(isManagerFromHigherAffiliate);

  if (isManagerFromHigherAffiliate) return teamPlayers;

  const isGeneralManager = playerID === generalManagerID;

  // If they are GM, return teamPlayers without the GM
  if (isGeneralManager) {
    return teamPlayers.filter(
      (player) => player.player_id !== generalManagerID
    );
  }

  // If they are an AGM return teamplayers without GMs and AGM
  return teamPlayers.filter(
    (player) =>
      player.player_id != generalManagerID &&
      assistantManagerIDs.every(
        (assistantID) => assistantID != player.player_id
      )
  );
};

async function signCmd(interaction) {
  // Get the team the user manages, if no team throw error
  const { managerTeamProfile } = await getManagerAndTeamFromInteractionUser(
    interaction.user.id
  );

  const divisionOption = interaction.options.getString("division");

  // Get the team the user is attempting to manage
  const teamProfile = await getTeamByDivisionOption(
    divisionOption,
    managerTeamProfile
  );

  if (teamProfile === null)
    throw new InvalidPermissionError(
      `That team does not exist or you are not a manager of it`
    );

  const canManageTeam = hasManagerPermsOfTeam(managerTeamProfile, teamProfile);

  if (!canManageTeam)
    throw new InvalidPermissionError(
      `You do not have manager permissions over **${teamProfile.name}**`
    );
  const { freeAgentPlayers, waiverPlayers } =
    await mainDatabase.getFreeAgentsAndWaivers();

  if (freeAgentPlayers.length === 0)
    throw new CommandError(
      "No eligible players",
      "There are no Free Agents to sign!"
    );

  const playerNameOption = interaction.options.getString("player_name");

  const selectedPlayerProfile = await mainDatabase.getPlayerByName(
    playerNameOption
  );

  if (selectedPlayerProfile === null)
    throw new CommandError(
      "Player does not exist",
      `Player **${playerNameOption}** does not exist`
    );

  const {
    player_id: playerID,
    player_name: playerName,
    discord_id: discordID,
  } = selectedPlayerProfile;
  // Now lets check if this player is a Free Agent
  const playerSignUp =
    freeAgentPlayers.find((player) => player.player_id == playerID) ?? null;

  if (playerSignUp === null) {
    const isWaiver =
      waiverPlayers.find((player) => player.player_id == playerID) ?? null;

    // Inform them hes in waivers, not free agency
    if (isWaiver)
      throw new CommandError(
        "Player is pending waivers",
        `${playerName} is pending waivers, and cannot be signed through Free Agency`
      );

    throw new CommandError(
      "Not a Free Agent",
      `**${playerName}** is not a Free Agent`
    );
  }

  // Now lets make sure they have suitable roster space
  await validateRosterSize(teamProfile);

  const buttons = getCancelAndConfirmButtonRow("signConfirm");

  const discordMember = await getDiscordMember(interaction, discordID);

  const confirmEmbed = new MessageEmbed()
    .setColor(teamProfile.color)
    .setTitle(`Confirm signing`)
    .setDescription(`Are you sure you want to sign **${playerName}** to **${
    teamProfile.name
  }**?\nDiscord: <@${discordID}>\n
    ${
      !discordMember
        ? "\n*Note: This user is no longer in the Discord or his Discord account has been deleted*"
        : ""
    }
    `);

  interaction.editReply({
    embeds: [confirmEmbed],
    components: [buttons],
    ephemeral: true,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    filter: (i) =>
      i.user.id === interaction.user.id && i.customId === "signConfirm",
    componentType: "BUTTON",
    time: 15000,
    max: 1,
  });

  collector.on("collect", async (i) => {
    if (discordMember) {
      discordMember.roles.remove(FREE_AGENT_ROLE_ID);
      discordMember.roles.add(teamProfile.role_id);
    }

    // Change his team in the database
    mainDatabase.updatePlayerTeam(playerID, teamProfile.team_id);

    const successEmbed = successEmbedCreator(
      "Successful signing!",
      `**${playerName}** has been signed to the **${teamProfile.name}**!`
    );

    const signEmbed = new MessageEmbed()
      .setColor(teamProfile.color)
      .setAuthor(
        `${teamProfile.name} sign ${playerName} from Free Agency`,
        teamProfile.logo_url
      )
      .setDescription(`<@${discordID}>`)
      .setTimestamp()
      .setFooter(
        `${interaction.user.username}`,
        interaction.user.displayAvatarURL()
      );

    const signDMEmbed = new MessageEmbed()
      .setColor(teamProfile.color)
      .setAuthor(`American Futsal League`, LOGO_URL)
      .setTitle(`You have been signed!`)
      .setDescription(`${teamProfile.name} have signed you from Free Agency!`);

    if (teamProfile.discord_invite) {
      signDMEmbed.addField(
        `Welcome to the team!`,
        `[Join Discord](${teamProfile.discord_invite})'${teamProfile.name} Discord'`
      );
    }

    await sendMessageIfValidUser(interaction, discordID, {
      embeds: [signDMEmbed],
    });

    await interaction.client.channels.cache.get(TRANSACTIONS_ID).send({
      embeds: [signEmbed],
    });

    await i.reply({
      embeds: [successEmbed],
      ephemeral: true,
    });

    sendInteractionCompleted(interaction);

    updateSignUpList(interaction.client);
    updateTeamRosters(interaction.client);
  });

  collector.on("end", (collected) => {
    if (collected.size >= 1) return;
    sendInteractionTimedOut(interaction);
  });
}

async function releaseCmd(interaction) {
  // Get the user's team, if no team throw error
  const { managerProfile, managerTeamProfile } =
    await getManagerAndTeamFromInteractionUser(interaction.user.id);

  const divisionOption = interaction.options.getString("division");

  // Get the team the user is attempting to manage
  const teamProfile = await getTeamByDivisionOption(
    divisionOption,
    managerTeamProfile
  );

  if (teamProfile === null)
    throw new InvalidPermissionError(
      `That team does not exist or you are not a manager of it`
    );

  const canManageTeam = hasManagerPermsOfTeam(managerTeamProfile, teamProfile);

  if (!canManageTeam)
    throw new InvalidPermissionError(
      `You do not have manager permissions over **${teamProfile.name}**`
    );

  const teamPlayers = await getTeamPlayersBasedOnManagerStatus(
    managerTeamProfile,
    teamProfile,
    managerProfile.player_id
  );

  if (teamPlayers.length === 0)
    throw new CommandError(
      "No players",
      `There are no active players on that team that can be released!`
    );

  const messageSelect = new MessageSelectMenu()
    .setCustomId("playerSelectRelease")
    .setPlaceholder("No player selected")
    .setMinValues(1)
    .setMaxValues(1);

  // Now lets map that to the messageSelect options format, make sure to filter out the GM, as the GM cant release himself
  const playerOptionsArray = teamPlayers
    .map((player) => {
      return {
        label: player.player_name,
        value: player.player_id,
      };
    })
    .filter((player) => player.value != managerProfile.player_id);

  messageSelect.addOptions(playerOptionsArray);

  const playerSelectMenu = new MessageActionRow().addComponents(messageSelect);

  const selectEmbed = new MessageEmbed().setTitle("Select a player to release");

  await interaction.editReply({
    embeds: [selectEmbed],
    components: [playerSelectMenu],
    ephemeral: true,
  });

  const selectionFilter = (i) =>
    i.user.id === interaction.user.id && i.customId === "playerSelectRelease";

  const selectCollector = interaction.channel.createMessageComponentCollector({
    filter: selectionFilter,
    componentType: "SELECT_MENU",
    time: 15000,
    max: 1,
  });

  selectCollector.on("collect", async (i) => {
    const { values } = i;

    const playerProfile = await mainDatabase.getPlayer(values[0]);

    const { discord_id } = playerProfile;

    const discordMember = await getDiscordMember(interaction, discord_id);

    const { player_name, current_team_id } = playerProfile;

    const teamProfile = await mainDatabase.getTeam(current_team_id);

    const buttons = getCancelAndConfirmButtonRow("releaseConfirm");

    const releaseConfirmEmbed = new MessageEmbed()
      .setColor(teamProfile.color)
      .setTitle(`Confirm release`)
      .setDescription(`Are you sure you want to release **${player_name}**?\nDiscord: <@${discord_id}>\nTeam: ${
      teamProfile.name
    }
    ${
      !discordMember
        ? "\n*Note: This user is no longer in the Discord or his Discord account has been deleted*"
        : ""
    }`);

    await i.reply({
      embeds: [releaseConfirmEmbed],
      components: [buttons],
      ephemeral: true,
    });

    //// Button collecotr

    const buttonFilter = (ir) =>
      ir.user.id === interaction.user.id && ir.customId === "releaseConfirm";

    const buttonCollector = interaction.channel.createMessageComponentCollector(
      {
        filter: buttonFilter,
        componentType: "BUTTON",
        time: 15000,
        max: 1,
      }
    );

    buttonCollector.on("collect", async (buttonInteraction) => {
      if (discordMember) {
        discordMember.roles.remove(teamProfile.role_id);
        discordMember.roles.add(FREE_AGENT_ROLE_ID);
      }

      // Change his team in the database, 0 is the no team role
      mainDatabase.updatePlayerTeam(playerProfile.player_id, 0);

      const successEmbed = successEmbedCreator(
        "Successful release",
        `**${playerProfile.player_name}** has been released from the **${teamProfile.name}** and is now a Free Agent.`
      );

      const releaseEmbed = new MessageEmbed()
        .setColor(teamProfile.color)
        .setAuthor(
          `${teamProfile.name} release ${playerProfile.player_name}`,
          teamProfile.logo_url
        )
        .setDescription(`<@${playerProfile.discord_id}> is now a Free Agent.`)
        .setTimestamp()
        .setFooter(
          `${interaction.user.username}`,
          interaction.user.displayAvatarURL()
        );

      const releaseDMEmbed = new MessageEmbed()
        .setColor(teamProfile.color)
        .setAuthor(`American Futsal League`, LOGO_URL)
        .setTitle(`You have been released!`)
        .setDescription(
          `${teamProfile.name} have cut ties with you. You are now a Free Agent!\n*Note: You do not have to sign up for Free Agency again*`
        );

      await sendMessageIfValidUser(interaction, playerProfile.discord_id, {
        embeds: [releaseDMEmbed],
      });

      await interaction.client.channels.cache.get(TRANSACTIONS_ID).send({
        embeds: [releaseEmbed],
      });

      // Now we just have to change his team in the database

      await buttonInteraction.reply({
        embeds: [successEmbed],
        ephemeral: true,
      });

      updateSignUpList(interaction.client);
      updateTeamRosters(interaction.client);

      sendInteractionCompleted(i);
      sendInteractionTimedOut(interaction);
    });

    buttonCollector.on("end", (collected) => {
      if (collected.size >= 1) return;
      sendInteractionTimedOut(i);
      sendInteractionTimedOut(interaction);
    });
  });

  selectCollector.on("end", (collected) => {
    if (collected.size >= 1) return;
    sendInteractionTimedOut(interaction);
  });
}

async function waiverCmd(interaction) {
  // Get the user's team, if no team throw error
  const { managerProfile, managerTeamProfile } =
    await getManagerAndTeamFromInteractionUser(interaction.user.id);

  const divisionOption = interaction.options.getString("division");

  const teamProfile = await getTeamByDivisionOption(
    divisionOption,
    managerTeamProfile
  );

  if (teamProfile === null)
    throw new InvalidPermissionError(
      `That team does not exist or you are not a manager of it`
    );

  const canManageTeam = hasManagerPermsOfTeam(managerTeamProfile, teamProfile);

  if (!canManageTeam)
    throw new InvalidPermissionError(
      `You do not have manager permissions over **${teamProfile.name}**`
    );

  const playerNameOption = interaction.options.getString("player_name");

  const selectedPlayerProfile = await mainDatabase.getPlayerByName(
    playerNameOption
  );

  if (selectedPlayerProfile === null)
    throw new CommandError(
      "Player does not exist",
      `Player **${playerNameOption}** does not exist`
    );

  const { waiverPlayers, freeAgentPlayers } =
    await mainDatabase.getFreeAgentsAndWaivers();

  if (waiverPlayers.length === 0)
    throw new CommandError(
      "No Waiver players",
      `There are no waiver players to place claims on`
    );

  // Check if the player is pending waivers by finding the selected player in the array of waiver players
  const isPendingWaiver = waiverPlayers.find(
    (player) => player.player_id == selectedPlayerProfile.player_id
  );

  if (!isPendingWaiver) {
    const isFreeAgent = freeAgentPlayers.find(
      (player) => player.player_id == selectedPlayerProfile.player_id
    );

    if (isFreeAgent)
      throw new CommandError(
        "Not pending waivers",
        `**${selectedPlayerProfile.player_name}** is a Free Agent. Try signing him through Free Agency`
      );

    throw new CommandError(
      "Not pending waivers",
      `**${selectedPlayerProfile.player_name}** is not pending waivers`
    );
  }

  // Check if the team has already placed a claim on this player and if they have already placed two claims

  const WAIVER_CLAIM_LIMIT = 2;

  const waiverClaimsByThisTeam = await mainDatabase.getTeamsWaiverClaims(
    teamProfile.team_id
  );

  if (waiverClaimsByThisTeam.length >= WAIVER_CLAIM_LIMIT)
    throw new CommandError(
      "Waiver claim limit reached",
      `You have reached the waiver claim limit of **${WAIVER_CLAIM_LIMIT}** for this waiver run.`
    );

  const alreadyPlacedWaiver = waiverClaimsByThisTeam.find(
    (player) => player.player_id == selectedPlayerProfile.player_id
  );

  if (alreadyPlacedWaiver) {
    // Get the player profile who placed the waiver on this player already
    const playerWhoPlacedWaiverProfile = await mainDatabase.getPlayer(
      alreadyPlacedWaiver.manager_id
    );
    throw new CommandError(
      "Invalid Claim",
      `A claim on **${selectedPlayerProfile.player_name}** has already been made for your team by **${playerWhoPlacedWaiverProfile.player_name}** on **${alreadyPlacedWaiver.timestamp}** `
    );
  }

  const buttons = getCancelAndConfirmButtonRow("waiverClaimConfirm");

  const discordMember = await getDiscordMember(
    interaction,
    selectedPlayerProfile.discord_id
  );

  const discordAvatarURL = discordMember
    ? discordMember.user.displayAvatarURL()
    : "";

  const confirmEmbed = new MessageEmbed()
    .setColor(teamProfile.color)
    .setTitle(`Confirm waiver claim`)
    .setThumbnail(discordAvatarURL)
    .setDescription(`Are you sure you want to place a waiver claim on **${
    selectedPlayerProfile.player_name
  }**?
    Discord: <@${selectedPlayerProfile.discord_id}>
    Using Waiver: ${teamProfile.name}
    ${
      !discordMember
        ? "*Note: This user is no longer in the Discord or his Discord account has been deleted*"
        : ""
    }
    `);

  interaction.editReply({
    embeds: [confirmEmbed],
    components: [buttons],
    ephemeral: true,
  });

  const filter = (i) =>
    i.user.id === interaction.user.id && i.customId === "waiverClaimConfirm";

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    componentType: "BUTTON",
    time: 15000,
    max: 1,
  });

  collector.on("collect", async (i) => {
    const timeStampStr = getDateTimeString();

    mainDatabase.placeWaiverClaim(
      teamProfile.team_id,
      managerProfile.player_id,
      selectedPlayerProfile.player_id,
      selectedPlayerProfile.player_name,
      timeStampStr
    );

    const successEmbed = successEmbedCreator(
      "Successful waiver claim!",
      `A waiver claim has been placed on **${selectedPlayerProfile.player_name}** using **${teamProfile.name}**'s waiver position.`
    );

    await i.reply({
      embeds: [successEmbed],
      ephemeral: true,
    });
  });

  collector.on("end", (collected) => {
    if (collected.size >= 1) return;
    sendInteractionTimedOut(interaction);
  });
}

module.exports = new Map([
  ["sign", signCmd],
  ["release", releaseCmd],
  ["waiver", waiverCmd],
]);
