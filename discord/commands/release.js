const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  perms: ["Admin", "General Manager"],
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
    if (this.perms.length !== 0) {
      const hasPerms = interaction.member.roles.cache.some((role) =>
        this.perms.includes(role.name)
      );

      if (!hasPerms) {
        interaction.reply({
          content: "You must be an admin to use that command",
          ephemeral: true,
        });

        return;
      }
    }
  },
};
