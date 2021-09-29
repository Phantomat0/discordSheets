const { SlashCommandBuilder } = require("@discordjs/builders");
const Sheet = require("../../sheets/sheet");

const stuff = [
  ["ST", "st"],
  ["AM", "am"],
  ["DM", "123"],
  ["GK", "addm"],
  ["ANY", "assm"],
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for the league")
    .addStringOption((option) => {
      option
        .setName("position")
        .setDescription("Your preferred position")
        .setRequired(true);

      stuff.forEach((stuff) => {
        const [name, slug] = stuff;
        option.addChoice(name, slug);
      });

      return option;
    })
    .addIntegerOption((option) =>
      option
        .setName("availability")
        .setDescription(
          "Rate your availability with an integer between 1 and 10"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("info").setDescription("Additional Info")
    ),
  async execute(interaction) {
    console.log(interaction.options);
    const availability = interaction.options.getInteger("availability");

    if (availability > 10 || availability < 1) {
      interaction.reply({
        content: `Error: Availability must be an integer between 1 and 10!`,
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: "Success! You have been signed up!",
        ephemeral: true,
      });
    }
  },
};
