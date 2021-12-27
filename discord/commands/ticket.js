const { SlashCommandBuilder } = require("@discordjs/builders");
const { TICKETS_ID, MOD_LOG_ID } = require("../config/channels");
const { ADMIN_ROLE_ID } = require("../config/roles");
const { successEmbedCreator } = require("../utils/embeds");
const subCommandsMap = require("./subcommands/tickets-sub");

module.exports = {
  allowedRoles: [ADMIN_ROLE_ID],
  allowedChannels: [TICKETS_ID],
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Submit a request ticket")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban-appeal")
        .setDescription("Ban Appeal")
        .addStringOption((option) =>
          option
            .setRequired(true)
            .setName("pub-name")
            .setDescription("Name used when banned")
        )
        .addStringOption((option) =>
          option
            .setRequired(true)
            .setName("room")
            .setDescription("Room from which you were banned")
            .addChoice("4v4", "4v4")
            .addChoice("3v3", "3v3")
            .addChoice("1v1", "1v1")
            .addChoice("Rambo", "rambo")
            .addChoice("Multiple Rooms", "multiple")
        )
        .addStringOption((option) =>
          option
            .setRequired(true)
            .setName("reason")
            .setDescription("Reason")
            .addChoice("Trolling", "trolling")
            .addChoice("Racial Slur", "racial_slur")
            .addChoice("Harassment", "harassment")
            .addChoice("Disruptive Behavior", "disruptive_behavior")
            .addChoice("Strong Language", "strong_language")
            .addChoice("Impersonation", "impersonation")
            .addChoice("Blacklisted", "blacklisted")
            .addChoice("Other", "other")
        )
        .addStringOption((option) =>
          option.setRequired(true).setName("appeal").setDescription("Appeal")
        )
    ),
  // .addStringOption((option) =>
  //   option
  //     .setName("type")
  //     .setDescription("Ticket type")
  //     .addChoice("Discord Request", "discord-request")
  //     .addChoice("Discord Report", "discord-report")
  //     .addChoice("Pub Request", "pub-request")
  //     .addChoice("Pub Ban Appeal", "pub-ban-appeal")
  //     .setRequired(true)
  // )
  // .addStringOption((option) =>
  //   option
  //     .setName("description")
  //     .setDescription("Shot description of the problem")
  //     .setRequired(true)
  // ),
  async execute(interaction) {
    const subCommandName = interaction.options.getSubcommand();

    const command = subCommandsMap.get(subCommandName);

    if (!command)
      throw new CommandError("Invalid Command", "That Command does not exist");

    console.log("YUP");

    await command(interaction);

    const successEmbed = successEmbedCreator(
      "Ticket submitted successfully!",
      `You will be notified of a response to your ticket in <#${MOD_LOG_ID}>`
    );

    await interaction.editReply({
      embeds: [successEmbed],
    });

    //   const ticketType = interaction.options.getString("type");
    //   const ticketDescription = interaction.options.getString("description");
    //   const ticketStarter = interaction.user;

    //   console.log(ticketStarter);

    //   const thread = await interaction.channel.threads.create({
    //     name: ticketType,
    //     autoArchiveDuration: 1440,
    //     reason: "CUZ",
    //   });

    //   const ticketEmbed = new MessageEmbed()
    //     .setTitle(ticketType)
    //     .setDescription(
    //       `By: ${ticketStarter.username}\nDescription: ${ticketDescription}\n\nFeel free to provide more details in regards to this ticket if necessary.`
    //     );

    //   thread.send({
    //     embeds: [ticketEmbed],
    //   });

    //   if (thread.joinable) await thread.join();
    //   await thread.members.add(interaction.user.id);

    //   const addDiscordMods =
    //     ticketType === "discord-request" || ticketType === "discord-report";
    //   const addPubAdmins =
    //     ticketType === "pub-ban-appeal" || ticketType === "pub-request";

    //   const allMembers = await interaction.guild.members.fetch();

    //   if (addDiscordMods) {
    //     allMembers
    //       .filter((player) =>
    //         player.roles.cache.find((role) => role.name === "Moderator")
    //       )
    //       .forEach((user) => {
    //         thread.members.add(user.user.id);
    //       });
    //   }

    //   if (addPubAdmins) {
    //     allMembers
    //       .filter((player) =>
    //         player.roles.cache.find((role) => role.name === "pub-admin")
    //       )
    //       .forEach((user) => {
    //         thread.members.add(user.user.id);
    //       });
    //   }

    //   interaction.editReply({
    //     content: "Ticket created!",
    //   });
  },
};
