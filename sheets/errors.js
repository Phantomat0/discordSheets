const { FileFolder } = require("../discord/utils/icons");

class SheetError {
  constructor(type, message) {
    this.type = type;
    this.message = message;
  }

  handleError() {
    console.error(`${this.type}: ${this.message}`);
    return null;
  }
}

class DatabaseError {
  constructor(type, message) {
    this.type = type;
    this.name = `${FileFolder} Database Error`;
    this.color = "#000000";
    this.message = message;
  }

  handleError() {
    console.error(`Database Error: ${this.type}: ${this.message}`);
  }

  getMessage() {
    return `${this.type}: ${this.message}`;
  }
}

module.exports = {
  SheetError,
  DatabaseError,
};
