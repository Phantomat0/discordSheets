const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { TICKET_LOG_ID, MOD_LOG_ID } = require("../../config/channels");
const { getDateTimeString, randomInRange } = require("../../utils/utils");

const BAN_REASONS = {
  trolling: "Trolling",
  racial_slur: "Racial Slur",
  harassment: "Harassment",
  disruptive_behavior: "Disruptive Behavior",
  strong_language: "Strong Language",
  impersonation: "Impersonation",
  blacklisted: "Blacklisted",
  other: "Other",
};

class BanAppealManager {
  constructor(
    ticketInteraction,
    buttonInteraction,
    ticketLogMessage,
    ticketObj,
    randomInt
  ) {
    this.ticketInteraction = ticketInteraction;
    this.buttonInteraction = buttonInteraction;
    this.ticketLogMessage = ticketLogMessage;
    this.ticketObj = ticketObj;
    this.randomInt = randomInt;
  }

  decideButtonTypeAndHandle() {
    const buttonID = this.buttonInteraction.customId;
    if (buttonID === `thread${this.ticketInteraction.user.id}${this.randomInt}`)
      return this._handleThread();
    if (buttonID === `reject${this.ticketInteraction.user.id}${this.randomInt}`)
      return this._handleReject();
    if (buttonID === `accept${this.ticketInteraction.user.id}${this.randomInt}`)
      return this._handleAccept();
  }

  async _sendAcceptMessage() {
    const { playerNameOption, roomOption, banReason, appealOption } =
      this.ticketObj;

    const timeStamp = getDateTimeString();

    const acceptEmbed = new MessageEmbed()
      .setTitle("Ban Appeal Accepted")
      .setColor("GREEN")
      .setDescription(
        `\`\`\`Name: ${playerNameOption}\nRoom: ${roomOption}\nReason: ${banReason}\nAppeal\n${appealOption}\n\`\`\`\n**By**: <@${this.buttonInteraction.user.id}>\n\n*${timeStamp}*`
      );

    await this.buttonInteraction.client.channels.cache.get(MOD_LOG_ID).send({
      content: `<@${this.ticketInteraction.user.id}>`,
      embeds: [acceptEmbed],
    });
  }

  async _sendRejectMessage(rejectionReason) {
    // If no reason is specified, make it say unspecified
    rejectionReason =
      rejectionReason === null ? "Unspecified" : rejectionReason;

    const { playerNameOption, roomOption, banReason, appealOption } =
      this.ticketObj;

    const timeStamp = getDateTimeString();

    const rejectionEmbed = new MessageEmbed()
      .setTitle("Ban Appeal Denied")
      .setColor("RED")
      .setDescription(
        `\`\`\`Name: ${playerNameOption}\nRoom: ${roomOption}\nReason: ${banReason}\nAppeal\n${appealOption}\n\`\`\`\n**Reason**: ${rejectionReason}\n**By**: <@${this.buttonInteraction.user.id}>\n\n*${timeStamp}*`
      );

    await this.buttonInteraction.client.channels.cache.get(MOD_LOG_ID).send({
      content: `<@${this.ticketInteraction.user.id}>`,
      embeds: [rejectionEmbed],
    });
  }

  async _handleThread() {
    this.buttonInteraction.reply({
      content: "Thread created",
      ephemeral: true,
    });

    const thread = await this.ticketInteraction.channel.threads.create({
      name: "ban appeal",
      type: "GUILD_PRIVATE_THREAD",
      autoArchiveDuration: 1440,
      reason: "Ban Appeal",
    });

    if (thread.joinable) await thread.join();

    // Add the admin who clicked on the button to create thread
    await thread.members.add(this.buttonInteraction.user.id);

    // Add the player who created the ticket
    await thread.members.add(this.ticketInteraction.user.id);

    const deleteThreadButton = new MessageActionRow().addComponents([
      new MessageButton()
        .setStyle("DANGER")
        .setLabel("Delete Thread")
        .setCustomId("deleteThread"),
    ]);

    thread.send({
      content: "Click the button below to delete this thread when complete",
      components: [deleteThreadButton],
    });

    const deleteButtonCollector = thread.createMessageComponentCollector({
      filter: (i) => {
        i.deferUpdate();
        return (
          i.user.id === this.buttonInteraction.user.id &&
          i.customId === "deleteThread"
        );
      },
      componentType: "BUTTON",
      max: 1,
    });

    deleteButtonCollector.on("collect", async (i) => {
      await thread.delete();
    });
  }

  async _handleReject() {
    this.buttonInteraction.reply({
      content: 'Type a reason for this rejection below, or type "skip" to skip',
      ephemeral: true,
    });

    const reasonCollector =
      this.buttonInteraction.channel.createMessageCollector({
        filter: (m) => m.author.id === this.buttonInteraction.user.id,
        time: 15000,
        max: 1,
      });

    reasonCollector.on("collect", async (m) => {
      const message = m.content === "skip" ? null : m.content;
      this._sendRejectMessage(message);
      m.delete();
      this.buttonInteraction.editReply("Command Complete");
    });

    reasonCollector.on("end", (collected) => {
      if (collected.size >= 1) return;
      this._sendRejectMessage(null);
      this.buttonInteraction.editReply("Command Complete");
    });

    this.ticketLogMessage.delete();
  }

  async _handleAccept() {
    this._sendAcceptMessage();
    this.ticketLogMessage.delete();
  }
}

async function appealCmd(interaction) {
  const randomInt = randomInRange(1, 1000);

  const { options } = interaction;

  const playerNameOption = options.getString("pub-name");
  const roomOption = options.getString("room");
  const reasonOption = options.getString("reason");
  const appealOption = options.getString("appeal");

  const banReason = BAN_REASONS[reasonOption];

  const ticketObj = {
    playerNameOption,
    roomOption,
    banReason,
    appealOption,
  };

  const appealEmbed = new MessageEmbed()
    .setColor("#5DADEC")
    .setTitle("Ban Appeal")
    .setDescription(
      `**User**: <@${interaction.user.id}>\n**Name**: ${playerNameOption}\n**Room**: ${roomOption}\n**Reason**: ${banReason}\n**Appeal**\n${appealOption}`
    );

  const threadButton = new MessageButton()
    .setCustomId(`thread${interaction.user.id}${randomInt}`)
    .setStyle("SECONDARY")
    .setLabel("Start Thread");
  const rejectButton = new MessageButton()
    .setCustomId(`reject${interaction.user.id}${randomInt}`)
    .setStyle("DANGER")
    .setLabel("Deny");
  const acceptButton = new MessageButton()
    .setCustomId(`accept${interaction.user.id}${randomInt}`)
    .setStyle("SUCCESS")
    .setLabel("Accept");

  const buttonRow = new MessageActionRow().addComponents([
    threadButton,
    rejectButton,
    acceptButton,
  ]);

  // Send the success ur thing was made!!!!!!
  const ticketLogMessage = await interaction.client.channels.cache
    .get(TICKET_LOG_ID)
    .send({
      embeds: [appealEmbed],
      components: [buttonRow],
    });

  const buttonCollector =
    ticketLogMessage.channel.createMessageComponentCollector({
      componentType: "BUTTON",
    });

  buttonCollector.on("collect", async (i) => {
    // await i.deferUpdate();
    new BanAppealManager(
      interaction,
      i,
      ticketLogMessage,
      ticketObj,
      randomInt
    ).decideButtonTypeAndHandle();
  });
}

async function nicknameCmd(interaction) {
  const newDiscordNameOption = options.getString("nickname");

  const nicknameEmbed = new MessageEmbed()
    .setColor("#2F3136")
    .setTitle("Nickname Change")
    .setDescription(
      `**User**: <@${interaction.user.id}>\n**Requested Name**: ${newDiscordNameOption}`
    );

  const rejectButton = new MessageButton()
    .setCustomId(`rejectNick${interaction.user.id}`)
    .setStyle("DANGER")
    .setLabel("Reject");
  const acceptButton = new MessageButton()
    .setCustomId(`acceptNick${interaction.user.id}`)
    .setStyle("SUCCESS")
    .setLabel("Accept");

  const buttonRow = new MessageActionRow().addComponents([
    rejectButton,
    acceptButton,
  ]);

  const ticketLogMessage = await interaction.client.channels.cache
    .get(TICKET_LOG_ID)
    .send({
      embeds: [nicknameEmbed],
      components: [buttonRow],
    });

  const buttonCollector =
    ticketLogMessage.channel.createMessageComponentCollector({
      componentType: "BUTTON",
    });

  buttonCollector.on("collect", async (i) => {
    if (i.customId === `rejectNick${interaction.user.id}`) {
    }

    if (i.customId === `acceptNick${interaction.user.id}`) {
      const timeStamp = getDateTimeString();

      const acceptEmbed = new MessageEmbed()
        .setTitle("Nickname Change Accepted")
        .setColor("GREEN")
        .setDescription(
          `**User**: <@${interaction.user.id}>\n\n*${timeStamp}*`
        );

      await this.buttonInteraction.client.channels.cache.get(MOD_LOG_ID).send({
        content: `<@${interaction.user.id}>`,
        embeds: [acceptEmbed],
      });
    }
  });
}

module.exports = new Map([
  ["ban-appeal", appealCmd],
  ["nickname", nicknameCmd],
]);
