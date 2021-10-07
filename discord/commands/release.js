const { SlashCommandBuilder } = require("@discordjs/builders");
const mainDatabase = require("../../database/main/main");
const { MY_GM_ID } = require("../config/channels");
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");
const { CommandError, InvalidPermissionError } = require("../bot-util");

module.exports = {
  perms: ["Admin", "General Manager"],
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release a player from your team")
    .addStringOption((option) =>
      option
        .setName("division")
        .setDescription("Division")
        .setRequired(true)
        .addChoice("Division 1", "division_1")
        .addChoice("Division 2", "division_2")
    ),

  async execute(interaction) {
    if (interaction.channelId !== MY_GM_ID)
      throw new CommandError(
        "Invalid Channel",
        `This command is only available in <#${MY_GM_ID}>`
      );

    if (this.perms.length !== 0) {
      const hasPerms = interaction.member.roles.cache.some((role) =>
        this.perms.includes(role.name)
      );

      if (!hasPerms)
        throw new InvalidPermissionError(
          `You are not authorized to use that command!`
        );

      const playerProfile = await mainDatabase.getPlayerByDiscordID(
        interaction.user.id
      );

      if (playerProfile === null)
        throw new InvalidPermissionError(
          `You are not registered as a player in the database`
        );

      const { player_id } = playerProfile;

      const teamProfile = await mainDatabase.getManagersTeam(player_id);

      if (teamProfile === null)
        throw new InvalidPermissionError(
          `That team does not exist or you are not the General Manager of it`
        );

      const divisionOption = interaction.options.getString("division");

      let teamPlayers = [];

      const { team_id, division_id } = teamProfile;

      if (divisionOption === "division_1") {
        // D2 GM trying to access D1 roster
        if (division_id == 2)
          throw new InvalidPermissionError(
            `You are not a manager of a D1 Team`
          );
        teamPlayers = await mainDatabase.getPlayersByTeam(team_id);
      }

      if (divisionOption === "division_2") {
        // Is this guy the manager of a D1 team?

        if (division_id == 1) {
          // Show his D2 Team
          const affiliateTeam = await mainDatabase.getTeamsAffiliate(team_id);

          teamPlayers = await mainDatabase.getPlayersByTeam(
            affiliateTeam.team_id
          );
        } else {
          teamPlayers = await mainDatabase.getPlayersByTeam(team_id);
        }
      }

      if (teamPlayers.length === 0)
        throw new CommandError(
          "No players",
          `There are no active players on that team!`
        );

      const messageSelect = new MessageSelectMenu()
        .setCustomId("playerSelectRelease")
        .setPlaceholder("No player selected")
        .setMinValues(1)
        .setMaxValues(1);

      // Now lets map that to the messageSelect options format
      const playerOptionsArray = teamPlayers.map((player) => {
        return {
          label: player.player_name,
          value: player.player_id,
        };
      });

      messageSelect.addOptions(playerOptionsArray);

      const playerSelectMenu = new MessageActionRow().addComponents(
        messageSelect
      );

      const selectEmbed = new MessageEmbed().setTitle(
        "Select a player to release"
      );

      await interaction.reply({
        embeds: [selectEmbed],
        components: [playerSelectMenu],
        ephemeral: true,
      });

      setTimeout(() => {
        const timeOutEmbed = new MessageEmbed().setTitle("Command timed out");
        interaction.editReply({
          embeds: [timeOutEmbed],
          components: [],
        });
      }, 15000);
    }
  },
};
