const { SlashCommandBuilder } = require("@discordjs/builders");
const { GreenCheck } = require("../utils/icons");
const mainDatabase = require("../../database/main/main");
const { MY_GM_ID, TRANSACTIONS_ID } = require("../config/channels");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { CommandError } = require("../utils/errors");
const { FREE_AGENT_ROLE_ID } = require("../config/roles");

const TEAMS = [
  ["Hellfish", "1"],
  ["Seoul Trains", "2"],
  ["Dayton Futsal Club", "3"],
  ["Savage Hax", "4"],
];

module.exports = {
  allowedRoles: ["Admin"],
  allowedChannels: [MY_GM_ID],
  data: new SlashCommandBuilder()
    .setName("draft")
    .setDescription("Draft a player to a team")
    .addStringOption((option) =>
      option
        .setName("division")
        .setDescription("Division")
        .setRequired(true)
        .addChoice("Division 1", "division_1")
        .addChoice("Division 2", "division_2")
    )
    .addStringOption((option) => {
      option.setName("team_id").setDescription("Team Name").setRequired(true);

      TEAMS.forEach((position) => {
        const [name, id] = position;
        option.addChoice(name, id);
      });

      return option;
    })
    .addIntegerOption((option) =>
      option
        .setName("player_id")
        .setDescription("The player's ID")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const divisionOption = interaction.options.getString("division");
    const teamIDOption = interaction.options.getString("team_id");
    const playerIDOption = interaction.options.getInteger("player_id");

    const freeAgents = await mainDatabase.getFreeAgents();

    const playerProfile = await mainDatabase.getPlayer(playerIDOption);

    if (playerProfile === null)
      throw new CommandError(
        "Player does not exist",
        `Player [${playerIDOption}] does not exist`
      );

    const isFreeAgent =
      freeAgents.find((player) => player.player_id == playerIDOption) ?? null;

    if (isFreeAgent === null)
      throw new CommandError(
        "Not a draft signup",
        `${playerProfile.player_name} is not eligible to be signed`
      );

    let team;
    const discordUser =
      interaction.guild.members.cache.get(playerProfile.discord_id) ?? null;

    if (divisionOption === "division_1") {
      const teamProfile = await mainDatabase.getTeam(teamIDOption);

      team = teamProfile;

      await mainDatabase.updatePlayerTeam(playerIDOption, teamProfile.team_id);

      discordUser?.roles.remove(FREE_AGENT_ROLE_ID);
      discordUser?.roles.add(teamProfile.role_id);
    } else {
      const teamProfile = await mainDatabase.getTeam(teamIDOption);
      const affiliateTeamProfile = await mainDatabase.getTeamsAffiliate(
        teamProfile.team_id
      );
      await mainDatabase.updatePlayerTeam(
        playerIDOption,
        affiliateTeamProfile.team_id
      );

      team = affiliateTeamProfile;

      discordUser?.roles.remove(FREE_AGENT_ROLE_ID);
      discordUser?.roles.add(affiliateTeamProfile.role_id);
    }

    setTimeout(() => {
      const timeOutEmbed = new MessageEmbed().setTitle("Command timed out");
      interaction.editReply({
        embeds: [timeOutEmbed],
        components: [],
      });
    }, 15000);

    const successEmbed = new MessageEmbed()
      .setColor("#75FF33")
      .setTitle(`${GreenCheck} Successful draft sign!`)
      .setDescription(
        `${playerProfile.player_name} has been signed to the **${team.name}**!`
      )
      .setTimestamp();

    interaction.editReply({
      embeds: [successEmbed],
    });

    const currentPickInt = "1";

    const draftEmbed = new MessageEmbed()
      .setColor(team.color)
      .setAuthor(
        `#${currentPickInt} ${team.name} select ${playerProfile.player_name}`,
        team.logo_url
      )
      .setDescription(`<@${playerProfile.discord_id}>`)
      .setTimestamp();

    await interaction.client.channels.cache.get(TRANSACTIONS_ID).send({
      embeds: [draftEmbed],
    });
  },
};
