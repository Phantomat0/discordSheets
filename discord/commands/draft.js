const { SlashCommandBuilder } = require("@discordjs/builders");
const { GreenCheck } = require("../utils/icons");
const mainDatabase = require("../../database/main/main");
const { DRAFT_ID, DRAFT_TRANSACTIONS_ID } = require("../config/channels");
const { MessageEmbed } = require("discord.js");
const { CommandError } = require("../utils/errors");
const { ADMIN_ROLE_ID, FREE_AGENT_ID } = require("../config/roles");
const {
  addDiscordRole,
  removeDiscordRole,
  getDiscordMember,
  updateSignUpList,
} = require("../utils/bot-utils");
const updateTeamRosters = require("../updaterosters");

module.exports = {
  allowedRoles: [ADMIN_ROLE_ID],
  allowedChannels: [DRAFT_ID],
  data: new SlashCommandBuilder()
    .setName("draft")
    .setDescription("Draft a player to a team")

    .addStringOption((option) =>
      option
        .setName("player_name")
        .setDescription("The player's name")
        .setRequired(true)
    ),

  async execute(interaction) {
    const playerNameOption = interaction.options.getString("player_name");

    const playerProfile = await mainDatabase.getPlayerByName(playerNameOption);

    console.log(playerProfile);

    if (playerProfile === null)
      throw new CommandError(
        "Player does not exist",
        `Player **${playerNameOption}** does not exist`
      );

    const NO_TEAM_ID = "0";

    if (playerProfile.current_team_id !== NO_TEAM_ID)
      throw new CommandError(
        "Illegal Draft",
        `Player **${playerNameOption}** is already on a team`
      );

    // Team drafting is the team who is making the pick, teamPick is the team who originally had the team, just incase there were trades
    const { teamDrafting, round, overall, teamPickName } =
      await mainDatabase.draftPlayer(playerProfile);

    console.log(teamPickName);

    const successEmbed = new MessageEmbed()
      .setColor("#75FF33")
      .setTitle(`${GreenCheck} Successful draft sign!`)
      .setDescription(
        `${playerProfile.player_name} has been drafted to **${teamDrafting.name}**!`
      )
      .setTimestamp();

    const teamPickAndTeamDraftSame = teamDrafting.name == teamPickName;

    // Now send it to the draft channel
    const draftStr = `Round ${round} Pick ${overall}, <@&${
      teamDrafting.role_id
    }>${teamPickAndTeamDraftSame ? "" : ` (from ${teamPickName})`} select: **${
      playerProfile.player_name
    }** <@${playerProfile.discord_id}>`;
    await interaction.client.channels.cache.get(DRAFT_TRANSACTIONS_ID).send({
      content: draftStr,
    });

    // Give the player the team role, and remove the Free Agent Role

    const discordMember = await getDiscordMember(playerProfile.discord_id);

    removeDiscordRole(discordMember, FREE_AGENT_ID);
    addDiscordRole(discordMember, teamDrafting.role_id);

    // Now update the team rosters, and the FA embed
    // updateTeamRosters(interaction.client);
    // updateSignUpList(interaction.client);

    await interaction.editReply({
      embeds: [successEmbed],
    });
  },
};
