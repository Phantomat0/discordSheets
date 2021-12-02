const { SlashCommandBuilder } = require("@discordjs/builders");
const { GreenCheck } = require("../utils/icons");
const mainDatabase = require("../../database/main/main");
const { MY_GM_ID, TRANSACTIONS_ID } = require("../config/channels");
const { MessageEmbed } = require("discord.js");
const { CommandError } = require("../utils/errors");
const { ADMIN_ROLE_ID } = require("../config/roles");

module.exports = {
  allowedRoles: [ADMIN_ROLE_ID],
  allowedChannels: [MY_GM_ID],
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
    const { teamDrafting, round, overall, teamPick } =
      await mainDatabase.draftPlayer(playerProfile);

    const successEmbed = new MessageEmbed()
      .setColor("#75FF33")
      .setTitle(`${GreenCheck} Successful draft sign!`)
      .setDescription(
        `${playerProfile.player_name} has been drafted to **${teamDrafting.name}**!`
      )
      .setTimestamp();

    // Now send it to the draft channel
    const draftStr = `Round ${round} Pick ${overall}, <@&${teamDrafting.role_id}> select: **${playerProfile.player_name}** <@${playerProfile.discord_id}>`;
    await interaction.client.channels.cache.get(TRANSACTIONS_ID).send({
      content: draftStr,
    });

    await interaction.editReply({
      embeds: [successEmbed],
    });
  },
};
