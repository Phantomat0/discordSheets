const { RedTriangle, DoNotEnter } = require("./icons");

class CommandError {
  constructor(type, message) {
    this.name = `${RedTriangle} Command Error`;
    this.type = type;
    this.color = "#000000";
    this.message = message;
  }

  getMessage() {
    return `${this.type}: ${this.message}`;
  }
}

class InvalidPermissionError {
  constructor(message) {
    this.name = `${DoNotEnter} Invalid Permissions`;
    this.type = "Invalid Permission";
    this.color = "#000000";
    this.message = message;
  }

  getMessage() {
    return this.message;
  }
}

module.exports = {
  InvalidPermissionError,
  CommandError,
};
