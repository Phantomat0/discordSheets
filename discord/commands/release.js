const { SlashCommandBuilder } = require("@discordjs/builders");
const mainDatabase = require("../../database/main/main");
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require("discord.js");

module.exports = {
  perms: ["Admin", "General Manager"],
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release a player from your team")
    .addStringOption((option) =>
      option
        .setName("divison")
        .setDescription("Division")
        .setRequired(true)
        .addChoice("Division 1", "divison_1")
        .addChoice("Division 2", "division_2")
    ),

  async execute(interaction) {
    // if (this.perms.length !== 0) {
    //   const hasPerms = interaction.member.roles.cache.some((role) =>
    //     this.perms.includes(role.name)
    //   );

    //   if (!hasPerms) {
    //     interaction.reply({
    //       content: "You must be an admin to use that command",
    //       ephemeral: true,
    //     });

    //     return;
    //   }

    const messageSelect = new MessageSelectMenu()
      .setCustomId("playerSelectRelease")
      .setPlaceholder("No player selected")
      .setMinValues(1)
      .setMaxValues(1);

    // We have to get the players team_id by discord
    // Get the players teams
    // Get either D1 team or D2, depending on the selection

    const teamID = 1;

    const teamPlayers = await mainDatabase.getPlayersByTeam(teamID);

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

    await interaction.reply({
      content: "Select a player to release",
      components: [playerSelectMenu],
      ephemeral: true,
    });
  },
};
