const { MessageEmbed } = require("discord.js");
const mainDatabase = require("../../../database/main/main");
const { successEmbedCreator } = require("../../utils/embeds");
const { CommandError } = require("../../utils/errors");
const { FANTASY_TRANSACTIONS_ID } = require("../../config/channels");
const { getCancelAndConfirmButtonRow } = require("../../utils/buttons");
const {
  sendInteractionCompleted,
  sendInteractionTimedOut,
} = require("../../utils/bot-utils");

async function joinCmd(interaction) {
  throw new CommandError("Ineligible", "Registration has closed.");
  // Check if already registered

  const playerProfile = await mainDatabase.getPlayerByDiscordID(
    interaction.user.id
  );

  if (playerProfile === null)
    throw new CommandError(
      "Ineligible",
      "Only players registered for the current season may play in fantasy."
    );

  const fantasyTeams = await mainDatabase.getFantasyTeams();

  if (fantasyTeams.some((team) => team.player_id === playerProfile.player_id))
    throw new CommandError(
      "Already signed up",
      "You are already signed up for fantasy!"
    );

  const teamName = interaction.options.getString("team");

  const alphaNumericSpecialCharacters = new RegExp(/^[\000-\177]*$/);

  const validTeamName = alphaNumericSpecialCharacters.test(teamName);

  if (!validTeamName)
    throw new CommandError(
      "Invalid Team Name",
      "Your team name cannot contain special characters"
    );

  await mainDatabase.registerFantasyTeam(playerProfile.player_id, teamName);

  const embed = successEmbed(
    `You are signed up!`,
    "You are signed up for this seasons Fantasy League!"
  );

  interaction.editReply({
    embeds: [embed],
    ephemeral: true,
  });
}

async function meCmd(interaction) {
  const playerProfile = await mainDatabase.getPlayerByDiscordID(
    interaction.user.id
  );

  if (!playerProfile)
    throw new CommandError("No Team Found", "You do not have a fantasy team.");

  const playerFantasyTeam = await mainDatabase.getPlayerFantasyCurrent(
    playerProfile.player_id
  );

  if (!playerFantasyTeam)
    throw new CommandError("No Team Found", "You do not have a fantasy team.");

  const { roster, teamName, totalPoints } = playerFantasyTeam;

  const [striker, midfielder, goalkeeper, ...flex] = roster;

  const flexMappedStr = flex
    .map((player) => `FLEX | ${player.name} ${player.points}`)
    .join("\n");

  // const rosterStr = `\`\`\`css\nST | ${striker.name} ${striker.points}\`\`\`\n\`\`\`css\nMID | ${midfielder.name} ${midfielder.points}\`\`\`\n\`\`\`fix\n${goalkeeper.name} ${goalkeeper.points}\`\`\`\nFLEX\n\`\`\`arm\n${flexMappedStr}\`\`\``;

  const rosterStr = `\`\`\`css\nST   | ${striker.name} ${striker.points}\nMID  | ${midfielder.name} ${midfielder.points}\nGK   | ${goalkeeper.name} ${goalkeeper.points}\n${flexMappedStr}\`\`\``;
  const teamEmbed = new MessageEmbed()
    .setColor("#2F3136")
    .setTitle(teamName)
    .setDescription(
      `Manager: ${playerProfile.player_name}\n**Total Points**\`\`\`fix\n${totalPoints}\`\`\`\n**Current Lineup**\n${rosterStr}`
    );

  //      `Manager: **${playerProfile.player_name}**\nTotal Points\`\`\`css\n${totalPoints}\`\`\`\n**Current Lineup**\n\`\`\`css\n${rosterMappedStr}\`\`\``

  interaction.editReply({
    embeds: [teamEmbed],
  });
}

async function editCmd(interaction) {
  // Check if editing is even open

  const { is_fantasy_open } = await mainDatabase.getConfig();

  const fantasyOpen = is_fantasy_open === "TRUE";

  if (!fantasyOpen)
    throw new CommandError(
      "Cannot make edits",
      "Editing of lineups is currently closed for the week."
    );

  const playerProfile = await mainDatabase.getPlayerByDiscordID(
    interaction.user.id
  );

  if (!playerProfile)
    throw new CommandError("No Team Found", "You do not have a fantasy team.");

  const playerFantasyTeam = await mainDatabase.getPlayerFantasyCurrent(
    playerProfile.player_id
  );

  if (!playerFantasyTeam)
    throw new CommandError("No Team Found", "You do not have a fantasy team.");

  const { options } = interaction;

  const playerOptions = [];

  for (let i = 0; i < 5; i++) {
    playerOptions.push({
      name: `player${i + 1}`,
      value: options.getString(`player-${i + 1}`),
      index: i,
    });
  }

  // Remove all null values aka values that werent used
  const selectedOptions = playerOptions.filter(
    (playerOption) => playerOption.value !== null
  );

  // If no edits were made, all options null
  if (selectedOptions.length === 0)
    throw new CommandError("No Edits", "You have made no edits");

  const players = await mainDatabase.getPlayers();

  // Check to see if all the players listed exist
  const invalidOption = selectedOptions.find(
    (playerOptionName) =>
      !players.some(
        (player) =>
          player.player_name.toLowerCase() ===
          playerOptionName.value.toLowerCase()
      )
  );

  if (invalidOption)
    throw new CommandError(
      "Invalid Player",
      `Player **${invalidOption.value}** does not exist`
    );

  const { roster, teamName } = playerFantasyTeam;

  // Prevent a player putting in duplicates in options

  const optionNamesLowerCase = selectedOptions.map((player) =>
    player.value.toLowerCase()
  );

  function checkIfDuplicateExists(array) {
    return new Set(array).size !== array.length;
  }

  const isDuplicatInOptions = checkIfDuplicateExists(optionNamesLowerCase);

  if (isDuplicatInOptions)
    throw new CommandError(
      "Invalid Players",
      `Duplicate players were attempted to be added`
    );

  // Prevent a player adding a player who is already on his roster

  const addingPlayerAlreadyOnRoster = roster.find((player) =>
    optionNamesLowerCase.includes(player.name.toLowerCase())
  );

  if (addingPlayerAlreadyOnRoster)
    throw new CommandError(
      "Invalid Player",
      `**${addingPlayerAlreadyOnRoster.name}** is already on your roster`
    );

  const fantasyRosterOnlyPlayerNames = roster.map((player) => player.name);

  // Now we have to map in order, to create the right array

  const playerChangesObj = selectedOptions.reduce(
    (changes, playerOption) => {
      // Log the change
      const playerNameWhoIsBeingRemoved =
        changes.newRosterArray[playerOption.index];
      const playerBeingMovedIn = playerOption.value;

      changes.changes.push({
        from: playerNameWhoIsBeingRemoved,
        to: playerOption.value,
      });

      // Swap the players
      changes.newRosterArray.splice(playerOption.index, 1, playerBeingMovedIn);

      return changes;
    },
    {
      newRosterArray: fantasyRosterOnlyPlayerNames,
      changes: [],
    }
  );
  const { newRosterArray, changes } = playerChangesObj;

  const changesStr = changes
    .map((change) => `${change.from} ==> **${change.to}**`)
    .join("\n");
  // Ok, now we just have to make the embeds

  const buttons = getCancelAndConfirmButtonRow("fantasyEditConfirm");

  const confirmEmbed = new MessageEmbed()
    .setColor("#2F3136")
    .setTitle(`Confirm fantasy lineup changes`)
    .setDescription(changesStr);

  interaction.editReply({
    embeds: [confirmEmbed],
    components: [buttons],
    ephemeral: true,
  });

  const filter = (i) =>
    i.user.id === interaction.user.id && i.customId === "fantasyEditConfirm";

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    componentType: "BUTTON",
    time: 15000,
    max: 1,
  });

  collector.on("collect", async (i) => {
    mainDatabase.updatePlayerFantasyRoster(
      playerProfile.player_id,
      newRosterArray
    );

    const successEmbed = successEmbedCreator(
      "Fantasy Lineup updated!",
      "Your lineup has been updated"
    );

    const transactionEmbed = new MessageEmbed()
      .setColor("#2F3136")
      .setTitle(`${playerProfile.player_name} has made changes to his lineup!`)
      .setDescription(`\`\`\`${teamName}\`\`\`\n${changesStr}`);

    interaction.client.channels.cache.get(FANTASY_TRANSACTIONS_ID).send({
      embeds: [transactionEmbed],
    });

    await i.reply({
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

async function otherCmd(interaction) {
  const playerNameOption = interaction.options.getString("player-name");

  const playerProfile = await mainDatabase.getPlayerByName(playerNameOption);

  if (playerProfile === null)
    throw new CommandError(
      "Player does not exist",
      `Player **${playerNameOption}** does not exist`
    );

  const playerFantasyTeam = await mainDatabase.getPlayerFantasyCurrent(
    playerProfile.player_id
  );

  if (!playerFantasyTeam)
    throw new CommandError(
      "No Team Found",
      `${playerProfile.player_name} does not have a fantasy team.`
    );

  const { roster, teamName } = playerFantasyTeam;

  const rosterMappedStr = roster
    .map((player) => `${player.name} ${player.points}`)
    .join("\n");

  const teamEmbed = new MessageEmbed()
    .setColor("#2F3136")
    .setTitle(teamName)
    .setDescription(
      `Manager: **${playerProfile.player_name}**\nTotal Points \`\`\`css\n0\`\`\`\nCurrent Lineup\n\`\`\`css\n${rosterMappedStr}\`\`\``
    );

  interaction.editReply({
    embeds: [teamEmbed],
  });
}

module.exports = new Map([
  ["join", joinCmd],
  ["me", meCmd],
  ["edit", editCmd],
  ["other", otherCmd],
]);
