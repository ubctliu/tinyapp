const GENERATE_RANDOM_STRING_LENGTH = 6;
const bcrypt = require("bcryptjs");

// Takes a email string and returns either an user object if found or undefined if not
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (Object.prototype.hasOwnProperty.call(database[user], "email") && database[user].email === email) {
      return database[user];
    }
  }

  return undefined;
};

// Generates a random 6 digit alpha-numeric string
const generateRandomString = () => {
  const randomURL = Math.random().toString(36).slice(2);
  return randomURL.length > GENERATE_RANDOM_STRING_LENGTH ? randomURL.substring(0, GENERATE_RANDOM_STRING_LENGTH) : randomURL;
};

// Takes a user object and a password string, returning true if password is correct and false otherwise
const verifyPassword = (user, password) => {
  if (user !== undefined) {
    if (bcrypt.compareSync(password, user.hashedPassword)) {
      return true;
    }
  }
  return false;
};

// Takes an id string and returns an object containing all URL objects owned by that id
const urlsForUser = (id, database) => {
  let ownedURLS = {};
  for (const url in database) {
    if (database[url].userID === id) {
      ownedURLS[url] = database[url];
    }
  }
  return ownedURLS;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  verifyPassword,
  urlsForUser
};