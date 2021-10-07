const { SlashCommandBuilder } = require("@discordjs/builders");
const mainDatabase = require("../../database/main/main");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test Database"),
  async execute(interaction) {
    try {
      const x = await mainDatabase.getManagersTeam(1);
      console.log(x);
    } catch (error) {
      if (error?.type) {
        error.handleError();
        return null;
      }
    }
  },
};
