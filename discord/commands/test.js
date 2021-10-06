const { SlashCommandBuilder } = require("@discordjs/builders");
const mainDatabase = require("../../database/main/main");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test Database"),
  async execute(interaction) {
    // const players = mainDatabase.getPlayersFromTeam(1);
    // console.log(players);

    const x = await mainDatabase.getPlayersByTeam(1);
    console.log(x, "test");
    interaction.reply("LOL IT WORKED");
  },
};
