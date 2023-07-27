// Takes a email string and returns either an user object if found or undefined if not
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (Object.prototype.hasOwnProperty.call(database[user], "email") && database[user].email === email) {
      return database[user];
    }
  }

  return undefined;
};

module.exports = { getUserByEmail };