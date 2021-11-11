const { MessageActionRow, MessageButton } = require("discord.js");

const cancelButton = new MessageButton()
  .setCustomId("cancel")
  .setLabel("Cancel")
  .setStyle("SECONDARY");

const buttonFactory = (IDStr, styleStr, labelStr) =>
  new MessageButton().setCustomId(IDStr).setStyle(styleStr).setLabel(labelStr);

const getCancelAndNextButtonRow = (nextID) => {
  return new MessageActionRow().addComponents(
    buttonFactory(nextID, "PRIMARY", "Next"),
    cancelButton
  );
};

const getCancelAndConfirmButtonRow = (confirmID) => {
  return new MessageActionRow().addComponents(
    buttonFactory(confirmID, "SUCCESS", "Confirm"),
    cancelButton
  );
};

module.exports = { getCancelAndConfirmButtonRow, getCancelAndNextButtonRow };
