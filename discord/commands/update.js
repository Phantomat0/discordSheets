const { SlashCommandBuilder } = require("@discordjs/builders");
const { updateSignUpList } = require("../bot-util");

module.exports = {
  perms: ["Admin"],
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Admin Only"),
  async execute(interaction, bot) {
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

    updateSignUpList(bot);

    await interaction.reply({
      content: "Signups Updated!",
      ephemeral: true,
    });
  },
};
