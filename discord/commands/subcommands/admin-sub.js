const {
  MessageEmbed,
  MessageSelectMenu,
  MessageActionRow,
} = require("discord.js");
const mainDatabase = require("../../../database/main/main");
const { LOGO_URL } = require("../../config/logo");
const {
  getTeamManagerIDs,
  validateRosterSize,
} = require("../../utils/database-utils");
const {
  updateSignUpList,
  getDiscordMember,
  sendInteractionCompleted,
  sendInteractionTimedOut,
  sendMessageIfValidUser,
} = require("../../utils/bot-utils");
const { getCancelAndConfirmButtonRow } = require("../../utils/buttons");
const { successEmbedCreator } = require("../../utils/embeds");
const { CommandError } = require("../../utils/errors");
const { TRANSACTIONS_ID, TRADES_ID } = require("../../config/channels");
const { Balance } = require("../../utils/icons");
const {
  GENERAL_MANAGER_ROLE_ID,
  ASSISTANT_MANAGER_ROLE_ID,
  FREE_AGENT_ROLE_ID,
} = require("../../config/roles");
const updateTeamRosters = require("../../updaterosters");
const CacheManager = require("../../../database/main/cachemanager");

async function appointManagerCmd(interaction) {
  const { options } = interaction;
  const teamIDOption = options.getString("team");
  const positionOption = options.getString("position");
  const playerNameOption = options.getString("player_name");

  const promotionStr =
    positionOption === "gm" ? "Manager" : "Assistant Manager";

  const teamProfile = await mainDatabase.getTeam(teamIDOption);

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

async function waiverSignCmd(interaction) {
  const teamOption = interaction.options.getString("team");
  const playerNameOption = interaction.options.getString("player_name");

  const teamProfile = await mainDatabase.getTeam(teamOption);

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

  await validateRosterSize(teamProfile);

  const discordMember = await getDiscordMember(interaction, discordID);

  const buttons = getCancelAndConfirmButtonRow("waiverSignConfirm");

  const confirmEmbed = new MessageEmbed()
    .setColor(teamProfile.color)
    .setTitle(`Confirm waiver signing`)
    .setDescription(`Are you sure you want to sign **${playerName}** to **${teamProfile.name}**?\nDiscord: <@${discordID}>
    `);

  interaction.editReply({
    embeds: [confirmEmbed],
    components: [buttons],
    ephemeral: true,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    filter: (i) =>
      i.user.id === interaction.user.id && i.customId === "waiverSignConfirm",
    componentType: "BUTTON",
    time: 15000,
    max: 1,
  });

  collector.on("collect", async (i) => {
    if (discordMember) {
      discordMember.roles.remove(FREE_AGENT_ROLE_ID);
      // discordMember.roles.add(teamProfile.role_id);
    }

    // Change his team in the database
    mainDatabase.updatePlayerTeam(playerID, teamProfile.team_id);

    const successEmbed = successEmbedCreator(
      "Successful waiver signing!",
      `**${playerName}** has been signed to the **${teamProfile.name}** through waivers!`
    );

    const signEmbed = new MessageEmbed()
      .setColor(teamProfile.color)
      .setAuthor(
        `${teamProfile.name} sign ${playerName} off of Waivers`,
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
      .setDescription(`${teamProfile.name} have signed you off of waivers!`);

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

async function getOrganizationPlayersNoGM(teamProfile) {
  const PlayersManagers = await new CacheManager(mainDatabase).loadCache(
    "players",
    mainDatabase.getPlayers
  );

  const affiliateTeamIDs = JSON.parse(teamProfile.affiliate_team_ids);

  // Get the players from the D1 team and then all of the affiliates
  const organizationPlayers = [teamProfile.team_id, ...affiliateTeamIDs]
    .map((teamID) => PlayersManagers.getPlayersByTeam(teamID))
    .flat();

  const { generalManagerID } = getTeamManagerIDs(teamProfile);

  const organizationPlayersNoGM = organizationPlayers.filter(
    (player) => player.player_id != generalManagerID
  );

  return organizationPlayersNoGM;
}

async function tradeCmd(interaction) {
  const { options } = interaction;

  const team1ID = options.getString("team1");
  const team2ID = options.getString("team2");
  const stipulationStr = options.getString("stipulation");

  if (team1ID === team2ID)
    throw new CommandError("Invalid Teams", "Duplicate Teams Selected");

  const team1Profile = await mainDatabase.getTeam(team1ID);
  const organizationPlayers = await getOrganizationPlayersNoGM(team1Profile);

  const messageSelect = new MessageSelectMenu()
    .setCustomId("team1PlayerTrade")
    .setPlaceholder("No players selected")
    .setMinValues(1);

  // Now lets map that to the messageSelect options format, make sure to filter out the GM, as the GM cant release himself
  const playerOptionsArray = organizationPlayers.map((player) => {
    return {
      label: player.player_name,
      value: player.player_id,
    };
  });

  console.log(playerOptionsArray);

  messageSelect.addOptions(playerOptionsArray);

  const playerSelectMenu = new MessageActionRow().addComponents(messageSelect);

  const selectEmbed = new MessageEmbed().setTitle(
    `Select the player's that will be traded AWAY from ${team1Profile.name}`
  );

  await interaction.editReply({
    embeds: [selectEmbed],
    components: [playerSelectMenu],
    ephemeral: true,
  });

  const team1SelectFilter = (i) =>
    i.user.id === interaction.user.id && i.customId === "team1PlayerTrade";

  const team1SelectCollector =
    interaction.channel.createMessageComponentCollector({
      filter: team1SelectFilter,
      componentType: "SELECT_MENU",
      time: 15000,
      max: 1,
    });

  team1SelectCollector.on("end", (collected) => {
    if (collected.size >= 1) return;
    sendInteractionTimedOut(interaction);
  });

  team1SelectCollector.on("collect", async (team1SelectInteraction) => {
    const team2Profile = await mainDatabase.getTeam(team2ID);

    const messageSelect2 = new MessageSelectMenu()
      .setCustomId("team2PlayerTrade")
      .setPlaceholder("No players selected")
      .setMinValues(1);

    const organizationPlayersTeam2 = await getOrganizationPlayersNoGM(
      team2Profile
    );

    // Now lets map that to the messageSelect options format, make sure to filter out the GM, as the GM cant release himself
    const playerOptionsArray2 = organizationPlayersTeam2.map((player) => {
      return {
        label: player.player_name,
        value: player.player_id,
      };
    });

    messageSelect2.addOptions(playerOptionsArray2);

    const playerSelectMenu2 = new MessageActionRow().addComponents(
      messageSelect2
    );

    const selectEmbed2 = new MessageEmbed().setTitle(
      `Select the player's that will be traded AWAY from ${team2Profile.name}`
    );

    team1SelectInteraction.reply({
      embeds: [selectEmbed2],
      components: [playerSelectMenu2],
      ephemeral: true,
    });

    sendInteractionCompleted(interaction);

    const team2SelectFilter = (i) =>
      i.user.id === interaction.user.id && i.customId === "team2PlayerTrade";

    const team2SelectCollector =
      interaction.channel.createMessageComponentCollector({
        filter: team2SelectFilter,
        componentType: "SELECT_MENU",
        time: 15000,
        max: 1,
      });

    team2SelectCollector.on("end", (collected) => {
      if (collected.size >= 1) return;
      sendInteractionTimedOut(team1SelectInteraction);
    });

    team2SelectCollector.on("collect", async (team2SelectInteraction) => {
      const team1PlayerIDs = team1SelectInteraction.values;
      const team2PlayerIDs = team2SelectInteraction.values;

      const PlayerManager = await new CacheManager(mainDatabase).loadCache(
        "players",
        mainDatabase.getPlayers
      );

      const getPlayerStrForEmbed = (playerIDsArray) => {
        return playerIDsArray
          .map((playerID) => {
            const player = PlayerManager.getPlayer(playerID);
            return `${player.player_name} <@${player.discord_id}>`;
          })
          .join("\n");
      };

      const team1PlayersStr = getPlayerStrForEmbed(team1PlayerIDs);
      const team2PlayersStr = getPlayerStrForEmbed(team2PlayerIDs);

      const confirmEmbed = new MessageEmbed()
        .setTitle("Confirm Trade")
        .addField(`${team1Profile.name} receive`, team2PlayersStr)
        .addField(`${team2Profile.name} receive`, team1PlayersStr);

      const buttons = getCancelAndConfirmButtonRow("tradeConfirm");

      if (stipulationStr) {
        confirmEmbed.addField("Stipulation", stipulationStr);
      }

      team2SelectInteraction.reply({
        embeds: [confirmEmbed],
        components: [buttons],
        ephemeral: true,
      });

      const buttonConfirmFilter = (i) =>
        i.user.id === interaction.user.id && i.customId === "tradeConfirm";

      const buttonCollector =
        interaction.channel.createMessageComponentCollector({
          filter: buttonConfirmFilter,
          componentType: "BUTTON",
          time: 15000,
          max: 1,
        });

      sendInteractionCompleted(team1SelectInteraction);

      buttonCollector.on("end", (collected) => {
        if (collected.size >= 1) return;
        sendInteractionTimedOut(team2SelectInteraction);
      });

      buttonCollector.on("collect", async (buttonInteraction) => {
        const successEmbed = successEmbedCreator(
          "Successful Trade",
          "This trade has gone through!"
        );

        // Ok now we have to do all the changing teams

        const TeamsManager = await new CacheManager(mainDatabase).loadCache(
          "teams",
          mainDatabase.getTeams
        );

        const updatePlayersTeams = (
          playerIDsArray,
          currentTeamProfile,
          newTeamProfile
        ) => {
          // newTeamProfile isn't exactly the new team, since it has to be adjusted for division

          const tradeDMEmbed = new MessageEmbed()
            .setColor(newTeamProfile.color)
            .setAuthor(`American Futsal League`, LOGO_URL)
            .setTitle(`You have been traded!`)
            .setDescription(
              `You have been traded from ${currentTeamProfile.name} to **${newTeamProfile.name}**`
            );

          playerIDsArray.forEach(async (playerID) => {
            const playerProfile = PlayerManager.getPlayer(playerID);

            const playerTeam = TeamsManager.getTeam(playerProfile.team_id);

            sendMessageIfValidUser(interaction, playerProfile.discord_id, {
              embeds: [tradeDMEmbed],
            });

            // Now we have to adjust newTeamProfile to the division the play is in
            newTeamProfile = TeamsManager.getTeamsDivisionAffiliate(
              newTeamProfile.team_id,
              playerTeam.division_id
            );

            // Now lets update the team in database, and discord

            mainDatabase.updatePlayerTeam(playerID, newTeamProfile.team_id);

            // const discordMember = await getDiscordMember(
            //   interaction,
            //   playerProfile.discord_id
            // );

            // discordMember.roles.remove(currentTeamProfile.role_id);
            // discordMember.roles.add(newTeamProfile.role_id);
          });
        };

        // Update the teams of the players
        updatePlayersTeams(team1PlayerIDs, team1Profile, team2Profile);
        updatePlayersTeams(team2PlayerIDs, team2Profile, team1Profile);

        const team1Emoji =
          interaction.guild.emojis.cache.find(
            (emoji) => emoji.name === team1Profile.emoji_name
          ) ?? "";

        const team2Emoji =
          interaction.guild.emojis.cache.find(
            (emoji) => emoji.name === team2Profile.emoji_name
          ) ?? "";

        const tradesChannelEmbed = new MessageEmbed()
          .setTitle(
            `Trade between ${team1Profile.name} and ${team2Profile.name}`
          )
          .setDescription(
            `**<:${team1Emoji?.name}:${team1Emoji?.id}> ${
              team1Profile.name
            } receive**\n ${team2PlayersStr}\n\n**<:${team2Emoji?.name}:${
              team2Emoji?.id
            }> ${team2Profile.name} receive**\n ${team1PlayersStr}\n\n${
              stipulationStr ? `*Stipulation: ${stipulationStr}*\n\n` : ""
            }Who won this trade?`
          )
          .setColor("#EA003D") // 36393F
          .setFooter(
            `${buttonInteraction.user.username}`,
            buttonInteraction.user.displayAvatarURL()
          )
          .setTimestamp();

        const tradeMessage = await interaction.client.channels.cache
          .get(TRADES_ID)
          .send({
            embeds: [tradesChannelEmbed],
          });

        tradeMessage.react(team1Emoji);
        tradeMessage.react(team2Emoji);
        tradeMessage.react(Balance);

        buttonInteraction.reply({
          embeds: [successEmbed],
          ephemeral: true,
        });

        sendInteractionCompleted(team2SelectInteraction);
        updateTeamRosters(interaction.client);
      });
    });
  });
}

function updateEmbedsCmd(interaction) {
  updateSignUpList(interaction.client);
  updateTeamRosters(interaction.client);
  // updateFantasy(interaction.client);

  const successEmbed = successEmbedCreator("Up to date!", "Embeds updated!");

  interaction.editReply({
    embeds: [successEmbed],
  });
}

module.exports = new Map([
  ["appoint", appointManagerCmd],
  ["waiversign", waiverSignCmd],
  ["trade", tradeCmd],
  ["updateembeds", updateEmbedsCmd],
]);
