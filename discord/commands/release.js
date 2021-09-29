const { SlashCommandBuilder } = require("@discordjs/builders");
const Sheet = require("../../sheets/sheet");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("release")
    .setDescription("Release a player from your team")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The gif category")
        .setRequired(true)
        .addChoice("Funny", "gif_funny")
        .addChoice("Meme", "gif_meme")
        .addChoice("Movie", "gif_movie")
    ),

  async execute(interaction) {
    Sheet.list();
  },
};
