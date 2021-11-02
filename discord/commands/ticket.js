const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { threadId } = require("worker_threads");
const { TICKETS_ID } = require("../config/channels");

module.exports = {
  allowedRoles: ["Admin"],
  allowedChannels: [TICKETS_ID],
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Submit a request ticket")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Ticket type")
        .addChoice("Discord Request", "discord-request")
        .addChoice("Discord Report", "discord-report")
        .addChoice("Pub Request", "pub-request")
        .addChoice("Pub Ban Appeal", "pub-ban-appeal")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Shot description of the problem")
        .setRequired(true)
    ),
  async execute(interaction) {
    const ticketType = interaction.options.getString("type");
    const ticketDescription = interaction.options.getString("description");
    const ticketStarter = interaction.user;

    console.log(ticketStarter);

    const thread = await interaction.channel.threads.create({
      name: ticketType,
      autoArchiveDuration: 1440,
      reason: "CUZ",
    });

    const ticketEmbed = new MessageEmbed()
      .setTitle(ticketType)
      .setDescription(
        `By: ${ticketStarter.username}\nDescription: ${ticketDescription}\n\nFeel free to provide more details in regards to this ticket if necessary.`
      );

    thread.send({
      embeds: [ticketEmbed],
    });

    if (thread.joinable) await thread.join();
    await thread.members.add(interaction.user.id);

    const addDiscordMods =
      ticketType === "discord-request" || ticketType === "discord-report";
    const addPubAdmins =
      ticketType === "pub-ban-appeal" || ticketType === "pub-request";

    const allMembers = await interaction.guild.members.fetch();

    if (addDiscordMods) {
      allMembers
        .filter((player) =>
          player.roles.cache.find((role) => role.name === "Moderator")
        )
        .forEach((user) => {
          thread.members.add(user.user.id);
        });
    }

    if (addPubAdmins) {
      allMembers
        .filter((player) =>
          player.roles.cache.find((role) => role.name === "pub-admin")
        )
        .forEach((user) => {
          thread.members.add(user.user.id);
        });
    }

    interaction.editReply({
      content: "Ticket created!",
    });
  },
};